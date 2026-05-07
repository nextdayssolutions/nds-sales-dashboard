# Supabase スキーマ

このディレクトリは Supabase の SQL マイグレーションを管理します。
本番 DB の正本は `migrations/` 配下です（`docs/03-db-schema.sql` は当初の参考 — 今は `migrations/` を信用してください）。

## マイグレーション一覧

| # | ファイル | 内容 |
|---|---|---|
| 0001 | `0001_init.sql` | 全テーブル + ENUM + RLS + トリガー + ヘルパー関数 |
| 0002 | `0002_seed_products.sql` | 商材マスタ初期 5 件（任意。実運用は admin UI から追加） |
| 0003 | `0003_harden_function_search_path.sql` | SECURITY DEFINER 関数の `search_path` 固定（脆弱性対策） |
| 0004 | `0004_optimize_rls_initplan.sql` | RLS の `auth.uid()` を `(SELECT auth.uid())` で包み init-plan 最適化 |
| 0005 | `0005_add_commission_fields.sql` | `products.commission_rate` + `sales_records.commission_amount` |
| 0006 | `0006_commission_type_and_fixed.sql` | `commission_type` ENUM (rate/fixed) + `commission_fixed` |
| 0007 | `0007_add_next_appointment.sql` | `customers.next_appointment_at DATE`（次回アポ日、UI で未来日入力時に status を自動「商談中」化）|
| 0008 | `0008_add_daily_sheet_kind.sql` | `sheet_kind` enum に `'daily'` 追加（日報シート対応）|
| 0009 | `0009_sales_quantity_and_recurrence.sql` | `sales_records.quantity` + `end_year/end_month`。ストック自動継続。既存 stock は `end = start` で backfill |
| 0010 | `0010_user_delete_cascades.sql` | 従業員削除時の FK 整備（customers/sales: CASCADE / audit_logs/users.manager_id: SET NULL）|
| 0011 | `0011_personal_sheets_supervisor_full_access.sql` | personal_sheets の supervisor RLS を UPDATE 専用 → ALL に拡張（admin/manager がシート未保存ユーザーにも初回 INSERT できるよう）|

新規プロジェクトを作成する時は **必ず番号順** で実行してください。詳細手順は [`docs/SETUP.md`](../docs/SETUP.md#2-supabase-プロジェクト構築) を参照。

> **Claude Code 経由なら MCP `apply_migration` で 1 件ずつ流せます**。`mcp__supabase__list_migrations` で適用済み状態を確認できます。

## スキーマ概要

| テーブル | 内容 | RLS |
|---|---|---|
| `users` | プロフィール（auth.users と FK） | 自分 / 配下 / admin 閲覧、自分編集（role 変更不可）/ admin 全権 |
| `products` | 商材マスタ（歩合設定含む、rate/fixed タイプ） | 全員閲覧、admin 編集 |
| `customers` | CRM 顧客（`next_appointment_at` 含む） | owner / 配下 / admin 閲覧、owner / admin 編集 |
| `sales_records` | 売上レコード（商材×月×ストック/ショット、`quantity`、`end_year/end_month`、歩合スナップショット）| 同上 |
| `revenue_targets` | 月次目標（owner_id × year × month）| 同上 |
| `personal_sheets` | 自己管理シート 5 種（daily / vision / goal / development / oneonone, JSONB content） | owner 全権 + supervisor (admin/manager) ALL |
| `calendar_events` | Google カレンダーキャッシュ（現状未使用、将来用） | 同 customers |
| `audit_logs` | 管理者操作監査 | admin 閲覧、authenticated INSERT、actor 削除時 SET NULL |

## ENUM

| 型 | 値 |
|---|---|
| `user_role` | `admin`, `manager`, `member` |
| `customer_status` | `prospect` (見込み), `lead` (商談中), `existing` (既存) |
| `revenue_type` | `stock`, `shot` |
| **`sheet_kind`** | **`daily`**, `vision`, `goal`, `development`, `oneonone` (← 0008 で `daily` 追加) |
| `product_category` | `stock`, `shot`, `both`, `other` |
| `commission_type` | `rate`, `fixed` |

## ヘルパー関数

| 関数 | 内容 |
|---|---|
| `public.current_user_role()` | 自分の role |
| `public.is_admin()` | admin か |
| `public.is_manager_of(uuid)` | 自分が指定ユーザーのマネージャーか |
| `public.can_view_user_data(uuid)` | 「自分 OR admin OR その人のマネージャー」を 1 関数で判定（多くの RLS で使用） |

すべて `SECURITY DEFINER` + `SET search_path = ''` で安全化済み（migration 0003）。

## auth.users → public.users 同期

`handle_new_user()` トリガーが `auth.users` への INSERT を監視し、`raw_user_meta_data` から profile を生成:

```sql
INSERT INTO public.users (id, email, full_name, role, department, title, manager_id)
VALUES (
  NEW.id, NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
  COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'member'),
  ...
);
```

→ admin が `auth.admin.createUser({ user_metadata: { full_name, role, ... } })` を呼ぶだけで profile が同期生成される（`app/actions/users.ts:createEmployeeAction`）。

## FK 削除動作（migration 0010）

ユーザー削除時の挙動を統一:

| FK | 削除動作 | 理由 |
|---|---|---|
| `customers.owner_id` → users | **CASCADE** | 顧客は担当者の所有物 |
| `sales_records.owner_id` → users | **CASCADE** | 売上は担当者の実績 |
| `revenue_targets.owner_id` → users | CASCADE (元々) | 目標は担当者付随 |
| `personal_sheets.user_id` → users | CASCADE (元々) | シートは本人付随 |
| `calendar_events.user_id` → users | CASCADE (元々) | カレンダーキャッシュ |
| `audit_logs.actor_id` → users | **SET NULL** | 履歴は保持、actor だけ NULL |
| `users.manager_id` → users | **SET NULL** | 配下は孤児にせずマネージャー未設定に |

## 型生成

スキーマ変更後は TypeScript 型を再生成:

```bash
# Supabase CLI 経由
npx supabase gen types typescript --project-id yyenxnnajyhrilbujuap --schema public > types/supabase.ts
```

または **Claude Code MCP 経由（推奨）**:
```
Claude が mcp__supabase__generate_typescript_types を呼ぶ
→ types/supabase.ts に書き出し
```

`types/supabase.ts` の `Database` 型が更新される。`types/index.ts` の app 型は手動で対応 ENUM やフィールドを追加。

## マイグレーション追加の流れ（Claude Code 想定）

```
1. supabase/migrations/000N_xxx.sql を新規作成（番号は連番）
2. mcp__supabase__apply_migration で本番 DB 反映
3. mcp__supabase__generate_typescript_types で types/supabase.ts 更新
4. types/index.ts と対応 store / component を更新
5. npx tsc --noEmit で型チェック
6. supabase/README.md の表に新マイグレーションを追記
7. commit + push
```

## 監査ログ

`createEmployeeAction` / `updateEmployeeAction` / `deleteEmployeeAction` / `resetEmployeePasswordAction` は `audit_logs` に記録します。
admin は `/admin` の「監査ログ」タブから閲覧予定（タブ自体は現状「準備中」表示）。
