# セットアップガイド

このドキュメントは **新規にゼロから本番環境を構築する人** または **既存プロジェクトに開発参加する人** 向けの実践手順です。

すでに本番稼働中（https://nds-sales-dashboard.vercel.app）の現プロジェクトに開発参加する場合は、管理者から `.env.local` の値をもらって [4. ローカル開発環境のセットアップ](#4-ローカル開発環境のセットアップ) から進めてください。

---

## 目次

1. [前提アカウント](#1-前提アカウント)
2. [Supabase プロジェクト構築](#2-supabase-プロジェクト構築)
3. [Google Cloud Console (Calendar OAuth)](#3-google-cloud-console-calendar-oauth)
4. [ローカル開発環境のセットアップ](#4-ローカル開発環境のセットアップ)
5. [Vercel 本番デプロイ](#5-vercel-本番デプロイ)
6. [運用タスク](#6-運用タスク)
7. [環境変数 完全リファレンス](#7-環境変数-完全リファレンス)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 前提アカウント

以下を事前に作成しておく:

| サービス | 用途 | URL |
|---|---|---|
| GitHub | リポジトリ | https://github.com |
| Supabase | DB / Auth | https://supabase.com |
| Google Cloud | Calendar OAuth | https://console.cloud.google.com |
| Vercel | ホスティング | https://vercel.com |
| Node.js 20+ | 開発 | https://nodejs.org |

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

Supabase Dashboard → 左メニュー **「SQL Editor」** で `supabase/migrations/` 配下を **必ず番号順** に実行:

| ファイル | 内容 |
|---|---|
| `0001_init.sql` | 全テーブル + RLS + ENUM + トリガー + ヘルパー関数 |
| `0002_seed_products.sql` | 商材マスタ初期データ（任意。実運用では admin UI から追加するため不要） |
| `0003_harden_function_search_path.sql` | SECURITY DEFINER 関数の search_path 固定（セキュリティ強化） |
| `0004_optimize_rls_initplan.sql` | RLS の `auth.uid()` を init-plan 最適化 |
| `0005_add_commission_fields.sql` | 歩合機能（`commission_rate` / `commission_amount`） |
| `0006_commission_type_and_fixed.sql` | 歩合タイプ enum + 定額歩合 |

各ファイルの中身をコピー → SQL Editor に貼り付け → Run。

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

`.env.local` を開き、以下 6 つを実値に置換:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
GOOGLE_OAUTH_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4-3. dev server 起動

```bash
npm run dev
```

http://localhost:3000 を開く → 自動で `/login` にリダイレクト → 初代 admin のメアド/パスワードでログイン。

`/admin` にアクセスして従業員テーブルが表示されれば成功。

---

## 5. Vercel 本番デプロイ

### 5-1. プロジェクト Import

1. https://vercel.com/new → 「Import Git Repository」
2. `nextdayssolutions/nds-sales-dashboard` を選択 → Import
3. Framework Preset は Next.js が自動検出される
4. Root Directory はデフォルト（`./`）のまま

### 5-2. 環境変数を 6 件設定

Settings → Environment Variables で以下を全部追加。Environment は Production / Preview / Development の **3 つ全てチェック**。

| Key | Value | Sensitive |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | OFF |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (`sb_publishable_...`) | OFF |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key (`sb_secret_...`) | **ON** |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth Client ID | OFF |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth Client Secret | **ON** |
| `NEXT_PUBLIC_APP_URL` | Vercel 本番 URL（`https://xxx.vercel.app`） | OFF |

### 5-3. Deploy

「Deploy」ボタン → 2〜3 分でビルド完了 → 本番 URL が確定（例: `https://nds-sales-dashboard.vercel.app`）。

### 5-4. URL 関連の事後設定

本番 URL 確定後、以下を更新:

1. **Vercel の `NEXT_PUBLIC_APP_URL`**: 仮の値で設定していたら正式 URL に Edit → Redeploy
2. **Google Cloud Console**: 承認済みリダイレクト URI に本番 URL 版を追加（ステップ 3-4 参照）
3. **Supabase**: Site URL / Redirect URLs に本番 URL 追加（ステップ 2-6 参照）

### 5-5. 自動デプロイ

main ブランチに push すれば Vercel が自動でビルド・デプロイします。env の変更は手動で Vercel 側を更新してから Redeploy が必要。

---

## 6. 運用タスク

### 6-1. 従業員を追加

1. admin でログイン → `/admin`
2. 右上「**従業員を招待**」
3. メール / 氏名 / 部署 / 役職 / ロール / マネージャー / 初期パスワード（自動生成 16 桁推奨）を入力
4. 作成 → メール + 初期パスワードを Slack 等で本人に伝達

### 6-2. パスワードリセット

**本人**: 画面右上 🔑「パスワード」ボタン → 新パスワード入力

**admin による他者リセット**: `/admin` → 従業員「詳細」→ 基本情報タブ → 🔑「パスワードをリセット」

### 6-3. 商材マスタ管理

`/admin` → 「商材管理」タブ → 「商材を追加」/ 既存商材の「編集」

各商材で以下を設定可:
- 名前
- 区分（ストック / ショット / 両方 / その他）
- 標準単価
- 歩合タイプ（率 % / 定額 円/件）
- 歩合値

歩合は売上記録時に自動計算され、`sales_records.commission_amount` にスナップショット保存されます（後で歩合率を変えても過去実績は固定）。

### 6-4. ユーザー削除

admin が `updateEmployeeAction` で `is_active=false` 化 or 完全削除（`auth.users` ごと CASCADE）。UI 未実装の場合は MCP / SQL で実施。

### 6-5. Google カレンダー連携

各従業員が `/dashboard` → スケジュールタブ → 「Googleカレンダーを連携」を自分で実行。
- 初回のみ「未検証アプリ」警告 → 「詳細」→ 「続行」
- 30 日先までの予定が日付別に表示
- 解除も本人が同画面から可能

### 6-6. Supabase Free 7 日停止対策（任意）

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

## 7. 環境変数 完全リファレンス

| 変数名 | 必須 | 公開 | 説明 |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | OK | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | OK | Publishable key（旧 anon） |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **NG** | RLS バイパス用、Server Action のみ |
| `GOOGLE_OAUTH_CLIENT_ID` | △ | OK | Calendar 連携時のみ必要 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | △ | **NG** | Calendar 連携時のみ必要 |
| `NEXT_PUBLIC_APP_URL` | ✅ | OK | OAuth リダイレクト URI 計算 |

`NEXT_PUBLIC_*` は client bundle にバンドルされる（公開）。それ以外はサーバー側のみ。

---

## 8. トラブルシューティング

| 症状 | 原因 / 対処 |
|---|---|
| ログインできるのに画面が変わらない | middleware が Supabase cookie を見つけられない。env 設定 + dev 再起動 |
| Google OAuth で `redirect_uri_mismatch` | リダイレクト URI 未登録。Cloud Console で完全一致のものを追加（末尾スラッシュ厳密） |
| Google OAuth で `access_denied` 403 | アプリが「テスト」段階のまま。OAuth 同意画面で「アプリを公開」 |
| 商材編集で「有効な値を入力してください」 | HTML5 step バリデーション。step を 1 にして緩和済み（小数 OK） |
| `0` を消せない | controlled input の問題。空文字 ⇔ 0 マッピング済み |
| モーダルがヘッダ内に押し込まれて表示 | `transform` 祖先による fixed 位置ズレ。`<ModalPortal>` でラップ |
| 売上が ¥10,000 未満で `0万` 表示 | `fmt()` 修正済み（`¥0.5万` 等の小数表記） |
| Vercel ビルド失敗 (env 関連) | env 設定後に Build Cache を OFF で Redeploy |
| 従業員数 100 超で OAuth 警告が出続ける | Google Verification 申請が必要（プライバシーポリシー等の URL 必要） |

詳しくは Vercel ビルドログ・ブラウザ Console・Supabase Logs を確認。
