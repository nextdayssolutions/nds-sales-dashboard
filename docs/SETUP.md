# セットアップガイド

このドキュメントは **新規にゼロから本番環境を構築する人** または **既存プロジェクトに開発参加する人** 向けの実践手順です。

すでに本番稼働中（https://nds-sales-dashboard.vercel.app）の現プロジェクトに開発参加する場合は、管理者から `.env.local` の値をもらって [4. ローカル開発環境のセットアップ](#4-ローカル開発環境のセットアップ) から進めてください。

> **このプロジェクトは Claude Code 前提**です。`.mcp.json` で Supabase MCP が常時利用可能になっており、マイグレーション適用・型生成・スキーマ確認をすべて Claude 経由で実行できます。

---

## 目次

1. [前提アカウント](#1-前提アカウント)
2. [Supabase プロジェクト構築](#2-supabase-プロジェクト構築)
3. [Google Cloud Console (Calendar OAuth)](#3-google-cloud-console-calendar-oauth)
4. [ローカル開発環境のセットアップ](#4-ローカル開発環境のセットアップ)
5. [Vercel 本番デプロイ](#5-vercel-本番デプロイ)
6. [Claude Code + Supabase MCP の使い方](#6-claude-code--supabase-mcp-の使い方)
7. [運用タスク](#7-運用タスク)
8. [環境変数 完全リファレンス](#8-環境変数-完全リファレンス)
9. [トラブルシューティング](#9-トラブルシューティング)

---

## 1. 前提アカウント

以下を事前に作成しておく:

| サービス | 用途 | URL |
|---|---|---|
| GitHub | リポジトリ | https://github.com |
| Supabase | DB / Auth | https://supabase.com |
| Google Cloud | Calendar OAuth | https://console.cloud.google.com |
| Vercel | ホスティング | https://vercel.com |
| Node.js 20+ | 開発ランタイム | https://nodejs.org |
| Claude Code | 開発支援 | https://claude.com/claude-code |

> **専用 Gmail を 1 個作る** ことを推奨。Google Cloud のオーナーや、社内通知の宛先に使う。

---

## 2. Supabase プロジェクト構築

### 2-1. プロジェクト作成

1. https://supabase.com/dashboard → 「New Project」
2. 設定:
   - Name: `sales-dashboard-prod`（任意）
   - Database Password: 強力なものを生成し **1Password 等に保管**
   - Region: **Northeast Asia (Tokyo)**
   - Pricing Plan: Free

### 2-2. マイグレーション適用

`supabase/migrations/` 配下を **必ず番号順** に実行します。

#### 方法 A: Claude Code 経由（推奨）

```
[ユーザー]「supabase/migrations/ を全部本番に流して」
→ Claude が mcp__supabase__list_migrations で適用済み確認
→ 未適用のものを順番に mcp__supabase__apply_migration
```

初回は MCP の認証が必要 — [6-2. 初回認証フロー](#6-2-初回認証フロー) 参照。

#### 方法 B: Supabase Dashboard 手動

Supabase Dashboard → 左メニュー **「SQL Editor」** で各ファイルの中身をコピー → 貼り付け → Run。

#### 全マイグレーション一覧

| # | ファイル | 内容 |
|---|---|---|
| 0001 | `0001_init.sql` | 全テーブル + ENUM + RLS + トリガー + ヘルパー関数 |
| 0002 | `0002_seed_products.sql` | 商材マスタ初期 5 件（任意。実運用は admin UI から追加） |
| 0003 | `0003_harden_function_search_path.sql` | SECURITY DEFINER 関数の search_path 固定（脆弱性対策） |
| 0004 | `0004_optimize_rls_initplan.sql` | RLS の `auth.uid()` を init-plan 最適化 |
| 0005 | `0005_add_commission_fields.sql` | `commission_rate` + `commission_amount` |
| 0006 | `0006_commission_type_and_fixed.sql` | `commission_type` ENUM + `commission_fixed` |
| 0007 | `0007_add_next_appointment.sql` | `customers.next_appointment_at`（次回アポ日）|
| 0008 | `0008_add_daily_sheet_kind.sql` | `sheet_kind` enum に `daily` 追加 |
| 0009 | `0009_sales_quantity_and_recurrence.sql` | `quantity` + `end_year/end_month`（ストック自動継続）|
| 0010 | `0010_user_delete_cascades.sql` | 従業員削除時の FK 整備（CASCADE / SET NULL）|
| 0011 | `0011_personal_sheets_supervisor_full_access.sql` | personal_sheets RLS を supervisor に ALL 権限 |

詳細は [`supabase/README.md`](../supabase/README.md) 参照。

### 2-3. Auth 設定

**Authentication → Providers → Email**:
- ✅ Enable Email provider
- ❌ **Confirm email: OFF**（admin が直接ユーザー作成するため確認不要）
- ✅ Secure email change
- ❌ **Allow new users to sign up: OFF**（自由登録を防ぎ、admin 経由のみに）
- ✅ Secure password change（推奨。最近ログインしたユーザーのみパスワード変更可）

その他のプロバイダ（Google など）はすべて **無効** で OK。

### 2-4. 初代 admin 作成

**Authentication → Users → Add user → Create new user**:

```
Email:    あなたの管理者メアド (例: shiiba@nextdays-solutions.com)
Password: 任意の初期パスワード（後で変更可能）
Auto Confirm User: ✅
```

作成後、**SQL Editor** で role を admin に昇格 + プロフィール設定:

```sql
UPDATE public.users
SET
  role = 'admin',
  full_name = '椎葉 光太',
  department = '代表',
  title = '代表'
WHERE email = 'あなたの管理者メアド';
```

これ以降のユーザー追加は **ログインした admin が画面の「従業員を招待」モーダル** から行います（SQL 不要）。

### 2-5. API キー取得

**Project Settings → API Keys**:

- **Publishable key** (`sb_publishable_...`) → `.env.local` の `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Secret key** (`sb_secret_...`) → `.env.local` の `SUPABASE_SERVICE_ROLE_KEY`

**Project Settings → API**:

- Project URL (`https://xxx.supabase.co`) → `.env.local` の `NEXT_PUBLIC_SUPABASE_URL`

### 2-6. Site URL 設定（Vercel デプロイ後）

**Authentication → URL Configuration**:

- **Site URL**: `https://<your-vercel-url>.vercel.app`
- **Redirect URLs**: 以下を両方追加
  - `http://localhost:3000/**`（ローカル開発）
  - `https://<your-vercel-url>.vercel.app/**`（本番）

末尾の `/**` 必須。

---

## 3. Google Cloud Console (Calendar OAuth)

社員が自分の Google カレンダーを連携できるようにします。

### 3-1. プロジェクト作成

1. https://console.cloud.google.com/ で専用 Gmail にログイン
2. 上部「プロジェクトの選択」→ 「新しいプロジェクト」
3. プロジェクト名: `nds-sales-dashboard`

### 3-2. Calendar API を有効化

1. 「APIとサービス」→「有効なAPIとサービス」→「+ APIとサービスを有効にする」
2. 検索窓に `Google Calendar API` → 選択 → **「有効にする」**

### 3-3. OAuth 同意画面の設定

1. 「APIとサービス」→「OAuth 同意画面」
2. **User Type: External** を選択 → 作成
3. アプリ情報:
   - アプリ名: `NDS 営業ダッシュボード`
   - ユーザーサポートメール: 専用 Gmail
   - デベロッパー連絡先: 専用 Gmail
   - 他は空欄で OK
4. スコープ追加: 「スコープを追加」→ `.../auth/calendar.readonly` のみ ✅
5. テストユーザー: 何も追加せず保存
6. **「アプリを公開」** ボタン → 確認 → ステータスが「本番環境」に
   - 注: 本番にしないと refresh_token が 7 日で失効します

### 3-4. OAuth クライアント ID を作成

1. 「APIとサービス」→「認証情報」→「+ 認証情報を作成」→ 「OAuth クライアント ID」
2. アプリケーションの種類: **ウェブアプリケーション**
3. 名前: `sales-dashboard`
4. **承認済みのリダイレクト URI** に以下を追加（本番 + ローカル両方）:
   ```
   http://localhost:3000/api/calendar/callback
   https://<your-vercel-url>.vercel.app/api/calendar/callback
   ```
5. 「作成」→ モーダルで **クライアント ID** と **クライアント シークレット** をコピー
   - → `.env.local` の `GOOGLE_OAUTH_CLIENT_ID` と `GOOGLE_OAUTH_CLIENT_SECRET`

> **注意**: JavaScript 生成元は登録不要（サーバーサイド OAuth のため）。

> 公開ステータス「本番」では初回連携時に「このアプリは確認されていません」警告が出ますが、「詳細」→「（安全ではないページ）に移動」で通過できます。100 ユーザー累積まで Google 検証なしで運用可能。

---

## 4. ローカル開発環境のセットアップ

### 4-1. クローン & インストール

```bash
git clone https://github.com/nextdayssolutions/nds-sales-dashboard.git
cd nds-sales-dashboard
npm install
```

### 4-2. 環境変数

```bash
cp .env.local.example .env.local
```

`.env.local` を開き、以下を実値に置換:

#### 必須 (4 件)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 任意 (Calendar 連携を使うなら)
```
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxx
```

#### 任意 (dev クイックログインを使うなら / 強く推奨)

ログイン画面下部に管理者・マネージャー・従業員の **ワンクリックサインインボタン**が出ます:

```
NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_EMAIL=dev-admin@nds.test
NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_PASSWORD=devpass1234
NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_EMAIL=dev-manager@nds.test
NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_PASSWORD=devpass1234
NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_EMAIL=dev-member@nds.test
NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_PASSWORD=devpass1234
```

dev テストユーザーは本番 DB に作成済み（`@nds.test` ドメインで本番ユーザーと区別）。本番ビルドでは UI から自動で隠蔽されます (`lib/dev-users.ts`)。**Vercel の本番環境にこれらの env vars は絶対設定しないこと**。

### 4-3. dev server 起動

```bash
npm run dev
```

http://localhost:3000 を開く → 自動で `/login` にリダイレクト → 初代 admin のメアド/パスワード（または dev クイックログインボタン）でログイン。

`/admin` にアクセスして従業員テーブルが表示されれば成功。

---

## 5. Vercel 本番デプロイ

### 5-1. プロジェクト Import

1. https://vercel.com/new → 「Import Git Repository」
2. `nextdayssolutions/nds-sales-dashboard` を選択 → Import
3. Framework Preset は Next.js が自動検出される
4. Root Directory はデフォルト（`./`）のまま

### 5-2. 環境変数を設定

Settings → Environment Variables で以下を追加。Environment は Production / Preview / Development の **3 つ全てチェック**（Preview デプロイでも本番 DB を共有するため）。

#### 必須 (4 件)

| Key | Value | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | OFF |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) | OFF |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_...`) | **ON** |
| `NEXT_PUBLIC_APP_URL` | Vercel 本番 URL（`https://xxx.vercel.app`） | OFF |

#### 任意 (Calendar 連携)

| Key | Value | Sensitive |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth Client ID | OFF |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth Client Secret | **ON** |

#### ⚠️ Vercel に設定してはいけない env vars

`NEXT_PUBLIC_DEV_QUICK_LOGIN_*_EMAIL` / `_PASSWORD` は **絶対に Vercel に登録しない**。本番ログイン画面に dev ボタンが出てしまう（NODE_ENV ガードはあるが、念のため値も渡さない）。

### 5-3. Deploy

「Deploy」ボタン → 2〜3 分でビルド完了 → 本番 URL が確定（例: `https://nds-sales-dashboard.vercel.app`）。

### 5-4. URL 関連の事後設定

本番 URL 確定後、以下を更新:

1. **Vercel の `NEXT_PUBLIC_APP_URL`**: 仮の値で設定していたら正式 URL に Edit → Redeploy
2. **Google Cloud Console**: 承認済みリダイレクト URI に本番 URL 版を追加（ステップ 3-4 参照）
3. **Supabase**: Site URL / Redirect URLs に本番 URL 追加（ステップ 2-6 参照）

### 5-5. 自動デプロイ

main ブランチに push すれば Vercel が自動でビルド・デプロイ:

```bash
git push origin main
# → 2〜3 分で本番反映
```

### 5-6. env を変更したら（重要）

`NEXT_PUBLIC_*` は **ビルド時にバンドルに焼き込まれる** ため、env を更新しただけでは反映されません:

1. Vercel ダッシュボード → Settings → Environment Variables で値を更新
2. Deployments → 最新 → ⋯ メニュー → **「Redeploy」**
3. **「Use existing Build Cache」のチェックを外す** → Redeploy
4. ハードリロード（Ctrl+Shift+R）でブラウザ・CDN キャッシュも回避

### 5-7. Preview デプロイ

main 以外のブランチに push すると Vercel が **Preview デプロイ**を作ります（ブランチ毎に URL が発行）。

- 本番と同じ Supabase DB を共有するので、機能テストは可能
- ただし**破壊的操作（DELETE, schema 変更）は本番ブランチで慎重に**
- Preview の URL は PR コメントに自動投稿される

---

## 6. Claude Code + Supabase MCP の使い方

このリポジトリには `.mcp.json` で Supabase MCP サーバが設定済み。Claude Code を起動するだけで以下が使えます。

### 6-1. 主要コマンド一覧

| ツール | 用途 |
|---|---|
| `mcp__supabase__list_tables` | スキーマ確認（DDL 前に必須）|
| `mcp__supabase__list_migrations` | 適用済みマイグレーション一覧 |
| `mcp__supabase__apply_migration` | DDL マイグレーション適用 |
| `mcp__supabase__execute_sql` | 任意 SQL 実行（読み取り中心、調査用）|
| `mcp__supabase__generate_typescript_types` | `types/supabase.ts` を再生成 |
| `mcp__supabase__get_logs` | Supabase ログ参照（auth / postgres / api 等）|
| `mcp__supabase__get_advisors` | セキュリティ・パフォーマンス警告 |

### 6-2. 初回認証フロー

新規開発者が初めて MCP コマンドを呼ぶときに 1 回だけ必要:

1. Claude が `mcp__supabase__authenticate` を実行 → 認証 URL を提示
2. その URL をブラウザで開く → Supabase でログイン → 認可
3. リダイレクト先 (`http://localhost:47971/callback?code=...&state=...`) は **接続できないエラー画面が出ます（正常）**
4. **ブラウザのアドレスバーから完全な URL をコピー**して Claude のチャットに貼る
5. Claude が `mcp__supabase__complete_authentication` で完了 → 以降のセッションは認証済

### 6-3. 推奨ワークフロー: スキーマ変更

```
[ユーザー]「customers に next_appointment_at カラム追加して」

  ↓ Claude が:
1. mcp__supabase__list_tables で customers の現状確認
2. supabase/migrations/000N_xxx.sql を作成
3. mcp__supabase__apply_migration で本番 DB に反映
4. mcp__supabase__generate_typescript_types で types/supabase.ts 更新
5. types/index.ts と関連 store / component を更新
6. supabase/README.md のマイグレーション一覧に追記
7. npx tsc --noEmit で型チェック
8. git commit + push
```

### 6-4. 注意

- `apply_migration` は **本番 DB を直接変更**します。実行前にユーザーに内容確認を取ること
- DDL は冪等性を意識（`IF NOT EXISTS`, `IF EXISTS`, `DROP POLICY IF EXISTS` を活用）
- マイグレーションファイルは `supabase/migrations/000N_xxx.sql` として **必ず** commit する（DB の正本）
- `execute_sql` は読み取り中心。重要な書き込みは migration ファイルにする

詳細は [`CLAUDE.md`](../CLAUDE.md#-claude-code--supabase-mcp-の使い方重要) も参照。

---

## 7. 運用タスク

### 7-1. 従業員を追加

1. admin でログイン → `/admin`
2. 右上「**従業員を招待**」
3. メール / 氏名 / 部署 / 役職 / ロール / マネージャー / 初期パスワード（自動生成 16 桁推奨）を入力
4. 作成 → メール + 初期パスワードを Slack 等で本人に伝達

### 7-2. パスワードリセット

**本人**: 画面右上 🔑「パスワード」ボタン → 新パスワード入力

**admin による他者リセット**: `/admin` → 従業員「詳細」→ 基本情報タブ → 🔑「パスワードをリセット」

### 7-3. 商材マスタ管理

`/admin` → 「商材管理」タブ → 「商材を追加」/ 既存商材の「編集」

各商材で以下を設定可:
- 名前
- 区分（ストック / ショット / 両方 / その他）
- 標準単価
- 歩合タイプ（率 % / 定額 円/件）
- 歩合値

歩合は売上記録時に自動計算され、`sales_records.commission_amount` にスナップショット保存されます（後で歩合率を変えても過去実績は固定）。

### 7-4. 従業員削除

`/admin` → 従業員「詳細」→ 基本情報タブ → 🗑「従業員を削除」（赤）

確認モーダルで対象者の氏名を入力 → 「完全削除する」をクリック。

- 自分自身は削除不可
- 他の admin は UI で非表示（誤操作防止）— admin を削除したい場合は role を member に変更してから
- 関連データ（顧客 / 売上 / シート）は migration 0010 の FK 設定で自動 CASCADE 削除
- 監査ログは保持（actor_id を SET NULL）

### 7-5. Google カレンダー連携（各従業員が個別に実施）

各従業員が `/dashboard` → スケジュールタブ → 「Googleカレンダーを連携」を自分で実行。
- 初回のみ「未検証アプリ」警告 → 「詳細」→ 「続行」
- 30 日先までの予定が日付別に表示
- 解除も本人が同画面から可能

### 7-6. dev テストユーザーのメンテ

dev クイックログインで使う `dev-*@nds.test` ユーザーは本番 DB に存在し、ローカル admin 画面のみで管理できます。

- 削除: ローカル admin 画面の従業員「詳細」→「従業員を削除」
- 一括削除 SQL（緊急時）:
  ```sql
  DELETE FROM auth.users WHERE email LIKE 'dev-%@nds.test';
  ```

### 7-7. Supabase Free 7 日停止対策（任意）

Supabase Free プランは 7 日アクセスが無いと停止します。GitHub Actions で週次 ping すると回避可能:

```yaml
# .github/workflows/keep-alive.yml
name: Keep Supabase alive
on:
  schedule:
    - cron: "0 3 * * 1"   # 毎週月曜 UTC 03:00
  workflow_dispatch:
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sS -o /dev/null -w "%{http_code}\n" \
            "${{ secrets.SUPABASE_URL }}/rest/v1/products?select=id&limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

GitHub → Settings → Secrets で `SUPABASE_URL` と `SUPABASE_ANON_KEY` を登録。

---

## 8. 環境変数 完全リファレンス

| 変数名 | 必須 | 公開 | 用途 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | OK | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | OK | Publishable key（旧 anon） |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **NG** | RLS バイパス用、Server Action のみ |
| `NEXT_PUBLIC_APP_URL` | ✅ | OK | OAuth リダイレクト URI 計算 |
| `GOOGLE_OAUTH_CLIENT_ID` | △ | OK | Calendar 連携時のみ必要 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | △ | **NG** | Calendar 連携時のみ必要 |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_EMAIL` | dev のみ | OK | クイックログインの admin email |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_PASSWORD` | dev のみ | dev のみ | 同 password |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_EMAIL` | dev のみ | OK | クイックログインの manager email |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_PASSWORD` | dev のみ | dev のみ | 同 password |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_EMAIL` | dev のみ | OK | クイックログインの member email |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_PASSWORD` | dev のみ | dev のみ | 同 password |

`NEXT_PUBLIC_*` は client bundle にバンドルされる（公開）。それ以外はサーバー側のみ。

**dev 用 env vars は `.env.local` のみに置き、Vercel には絶対設定しない**。

---

## 9. トラブルシューティング

### ログイン / セッション

| 症状 | 原因 / 対処 |
|---|---|
| ログインできるのに画面が変わらない | middleware が Supabase cookie を見つけられない。env 設定 + dev 再起動 (Ctrl+C → `npm run dev`) |
| セッションがすぐ切れる | Supabase URL Configuration の Redirect URLs に `http://localhost:3000/**` が登録されているか |

### Google OAuth

| 症状 | 対処 |
|---|---|
| `redirect_uri_mismatch` | Cloud Console のリダイレクト URI が完全一致してない（末尾スラッシュ厳密） |
| `access_denied` 403 | OAuth 同意画面が「テスト」段階のまま。「アプリを公開」 |
| 100 ユーザー超で警告継続 | Google Verification 申請が必要（プライバシーポリシー等の URL 必要） |

### Vercel デプロイ

| 症状 | 対処 |
|---|---|
| ビルド失敗 (env 関連) | env 設定後に **Build Cache OFF** で Redeploy |
| デプロイ後も変更が反映されない | (1) デプロイ完了確認 (2) Ctrl+Shift+R でハードリロード (3) Build Cache OFF で Redeploy |
| Preview と本番で挙動が違う | env が Preview にも設定されているか確認 |

### Supabase MCP

| 症状 | 対処 |
|---|---|
| MCP コマンドが「未認証」エラー | Claude に `mcp__supabase__authenticate` を呼んでもらい再認証 |
| `apply_migration` が失敗 | 既存制約と衝突 / IF NOT EXISTS が無い等。エラーメッセージを Claude に渡して修正依頼 |
| `generate_typescript_types` が古い型を返す | スキーマ変更が apply されているか `list_migrations` で確認 |

### UI / フォーム

| 症状 | 対処 |
|---|---|
| 商材編集で「有効な値を入力してください」 | HTML5 step バリデーション。`step={1}` で緩和 |
| `0` を消せない | controlled input の問題。`value={n===0?"":n}` パターン適用 |
| モーダルがヘッダ内に押し込まれる | `<ModalPortal>` でラップしていない |
| 売上が `0万` 表示 | `fmt()` 古い実装。`lib/utils.ts` 確認 |

### データ整合性

| 症状 | 対処 |
|---|---|
| admin が他人のシート保存に失敗 | migration 0011 (personal_sheets supervisor 全権) が適用されているか |
| 従業員削除で FK エラー | migration 0010 (FK 削除動作整備) が適用されているか |
| ストックが二重計上される | migration 0009 の backfill (`end = start`) が走ったか確認 |
| 本番 admin に DEV ユーザーが見える | `lib/dev-users.ts:shouldHideDevTestUsers()` が機能しているか。NODE_ENV を確認 |

### dev クイックログイン

| 症状 | 対処 |
|---|---|
| ログイン画面に dev ボタンが出ない | `.env.local` に `NEXT_PUBLIC_DEV_QUICK_LOGIN_*` を設定 + dev server 再起動 (Next.js は env をホット読み込みしない) |
| dev ボタンを押しても無反応 | テストユーザーが DB に存在しない可能性。Claude に「`@nds.test` ユーザーを再作成して」と依頼 |

詳しくは Vercel ビルドログ・ブラウザ Console・Supabase Logs を確認。
