# Supabase セットアップ

このディレクトリは Supabase へ流し込む SQL を管理します。

## 初回セットアップ手順

### 1. プロジェクト作成
- https://supabase.com で「New Project」
- Region: **Northeast Asia (Tokyo)**
- DB password を 1password 等に保管

### 2. スキーマ適用
Supabase Dashboard → **SQL Editor** で以下を順に実行:

1. `migrations/0001_init.sql` ← 全テーブル + RLS + トリガー + ヘルパー関数
2. `migrations/0002_seed_products.sql` ← 商材マスタ初期データ（任意、admin 画面でも追加可）

### 3. Email 認証を有効化
**Authentication → Providers → Email**
- Enable Email provider: ✅
- **Confirm email: OFF**（admin が直接パスワード設定するため）
- Secure email change: ON

その他のプロバイダ（Google など）は無効のままで OK。

### 4. 初代 admin の作成

Supabase Dashboard → **Authentication → Users → Add user → Create new user**

```
Email:    あなたの管理者メアド
Password: 任意の初期パスワード
Auto Confirm User: ✅
```

作成後、SQL Editor で role を admin に昇格:

```sql
UPDATE public.users
SET role = 'admin', full_name = '管理者氏名', department = '管理部', title = '管理者'
WHERE email = 'あなたの管理者メアド';
```

これ以降のユーザー追加は、ログインした admin が画面の「従業員を登録」モーダルから行えます。

### 5. Vercel に環境変数を設定

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## スキーマ概要

| テーブル | 内容 | RLS |
|---|---|---|
| `users` | プロフィール（auth.users と FK） | 自分閲覧、admin 全権 |
| `products` | 商材マスタ | 全員閲覧、admin 編集 |
| `customers` | CRM 顧客 | owner / 配下で閲覧、owner 編集 |
| `sales_records` | 売上レコード（商材×月×ストック/ショット）| 同上 |
| `revenue_targets` | 月次目標（owner_id × year × month）| 同上 |
| `personal_sheets` | 自己管理シート4種（vision/goal/development/oneonone, JSONB content） | 同上 + 教育担当の更新権限 |
| `calendar_events` | Google カレンダーキャッシュ | 同上 |
| `audit_logs` | 管理者操作監査 | admin 閲覧 |

## ヘルパー関数

| 関数 | 内容 |
|---|---|
| `public.current_user_role()` | 自分の role |
| `public.is_admin()` | admin か |
| `public.is_manager_of(uuid)` | 自分が指定ユーザーのマネージャーか |
| `public.can_view_user_data(uuid)` | 「自分 / 配下 / admin」のどれか（多くのRLSで使用） |

## 型生成

Supabase CLI が入っていれば、TypeScript 型を自動生成できます:

```bash
npx supabase gen types typescript --project-id <project-id> --schema public > types/supabase.ts
```

これで `Database` 型が `lib/supabase/server.ts` 等で型安全に使えます。
