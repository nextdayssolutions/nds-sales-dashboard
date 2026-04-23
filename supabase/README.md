# Supabase スキーマ

このディレクトリは Supabase の SQL マイグレーションを管理します。
本番 DB の正本は `migrations/` 配下です（`docs/03-db-schema.sql` は当初の参考 — 今は `migrations/` を信用してください）。

## マイグレーション一覧

| ファイル | 内容 |
|---|---|
| `migrations/0001_init.sql` | 全テーブル + ENUM + RLS + トリガー + ヘルパー関数 |
| `migrations/0002_seed_products.sql` | 商材マスタ初期 5 件（任意。実運用は admin UI から追加） |
| `migrations/0003_harden_function_search_path.sql` | SECURITY DEFINER 関数の `search_path` 固定（脆弱性対策） |
| `migrations/0004_optimize_rls_initplan.sql` | RLS の `auth.uid()` を `(SELECT auth.uid())` で包み init-plan 最適化 |
| `migrations/0005_add_commission_fields.sql` | `products.commission_rate` + `sales_records.commission_amount` |
| `migrations/0006_commission_type_and_fixed.sql` | `commission_type` ENUM (rate/fixed) + `commission_fixed` |

新規プロジェクトを作成する時は **必ず番号順** で実行してください。詳細手順は [`docs/SETUP.md`](../docs/SETUP.md#2-supabase-プロジェクト構築) を参照。

## スキーマ概要

| テーブル | 内容 | RLS |
|---|---|---|
| `users` | プロフィール（auth.users と FK） | 自分 / 配下 / admin 閲覧、自分編集（role 変更不可）/ admin 全権 |
| `products` | 商材マスタ（歩合設定含む） | 全員閲覧、admin 編集 |
| `customers` | CRM 顧客 | owner / 配下 / admin 閲覧、owner / admin 編集 |
| `sales_records` | 売上レコード（商材×月×ストック/ショット、歩合スナップショット）| 同上 |
| `revenue_targets` | 月次目標（owner_id × year × month）| 同上 |
| `personal_sheets` | 自己管理シート 4 種（vision/goal/development/oneonone, JSONB content） | 同上 + 教育担当 (manager/admin) の更新権限 |
| `calendar_events` | Google カレンダーキャッシュ（現状未使用、将来用） | 同上 |
| `audit_logs` | 管理者操作監査 | admin 閲覧、authenticated INSERT |

## ENUM

| 型 | 値 |
|---|---|
| `user_role` | `admin`, `manager`, `member` |
| `customer_status` | `prospect` (見込み), `lead` (商談中), `existing` (既存) |
| `revenue_type` | `stock`, `shot` |
| `sheet_kind` | `vision`, `goal`, `development`, `oneonone` |
| `product_category` | `stock`, `shot`, `both`, `other` |
| `commission_type` | `rate`, `fixed` |

## ヘルパー関数

| 関数 | 内容 |
|---|---|
| `public.current_user_role()` | 自分の role |
| `public.is_admin()` | admin か |
| `public.is_manager_of(uuid)` | 自分が指定ユーザーのマネージャーか |
| `public.can_view_user_data(uuid)` | 「自分 OR admin OR その人のマネージャー」を 1 関数で判定（多くの RLS で使用） |

すべて `SECURITY DEFINER` + `SET search_path = ''` で安全化済み。

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

## 型生成

スキーマ変更後は TypeScript 型を再生成:

```bash
# Supabase CLI 経由
npx supabase gen types typescript --project-id <project_id> --schema public > types/supabase.ts

# あるいは Claude Code MCP 経由
# mcp__supabase__generate_typescript_types を呼ぶ
```

`types/supabase.ts` の `Database` 型が更新される。

## マイグレーション追加の流れ

1. `migrations/000N_xxx.sql` を新規作成（番号は連番）
2. Supabase Dashboard → SQL Editor で実行（または Claude Code MCP の `apply_migration`）
3. 型再生成（上記）
4. 対応する store / 型を更新
5. `npx tsc --noEmit` で確認
6. commit + push

## 監査ログ

`createEmployeeAction` / `updateEmployeeAction` / `deleteEmployeeAction` / `resetEmployeePasswordAction` は `audit_logs` に記録します。
admin は `/admin` の「監査ログ」タブから閲覧（タブ自体は将来実装）。
