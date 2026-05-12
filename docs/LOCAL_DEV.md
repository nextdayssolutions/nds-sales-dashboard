# ローカル DB（Docker Supabase）で動かす

デフォルトでは、ローカル開発も**本番と同じクラウド Supabase DB** に繋がります（社内利用想定で環境分離なし）。
スキーマ変更を試したい・破壊的操作を本番に影響させたくないなど、別の DB で確認したい時は、Docker で立ち上げたローカル Supabase に切り替えられます。

## 仕組み

- 本番 DB: `.env.local` を `npm run dev` が読む（従来通り）
- ローカル DB: `.env.docker.local` を `npm run dev:local` が読む（dotenv-cli 経由）

**`.env.local` には一切触らない**ので、毎回ファイルをコピーし直す必要はありません。コマンドだけで切り替わります。

## 前提

- **Docker Desktop** がインストール済みで起動している
- `npm install` 済（`supabase` CLI と `dotenv-cli` が `devDependencies` に含まれている）

## 初回セットアップ

### 1. ローカル Supabase 一式を起動

```bash
npm run db:start
```

初回は Postgres / GoTrue / PostgREST / Realtime / Storage / Studio などのコンテナイメージを pull するので 5〜15 分かかります。
2 回目以降は 30 秒程度。

完了すると以下のような出力が出ます:

```
        API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJhbGc...     ← これをコピー
service_role key: eyJhbGc...     ← これもコピー
```

> 後から表示し直したい時は `npm run db:status`

### 2. `.env.docker.local` を作成

本番用の `.env.local` には**触らず**、別ファイルを作る:

```bash
cp .env.docker.local.example .env.docker.local
```

`.env.docker.local` を開き、上記出力の `anon key` と `service_role key` を `REPLACE_WITH_OUTPUT_OF_supabase_status` の部分に貼り付ける。

### 3. migrations を適用

```bash
npm run db:reset
```

`supabase/migrations/0001_*` 〜 `0012_*` まで全部流れます。テーブル / RLS / トリガー / ENUM / ヘルパー関数すべて再現されます。

### 4. dev テストユーザーを作成

```bash
npm run db:seed:dev
```

3 アカウントが作成されます（パスワードは全て `devpass1234`）:

| Email | Role |
|---|---|
| `dev-admin@nds.test` | admin |
| `dev-manager@nds.test` | manager |
| `dev-member@nds.test` | member |

> このスクリプトは `localhost` / `127.0.0.1` 以外の SUPABASE_URL に対しては自動で拒否します（誤って本番に流すのを防止）

### 5. アプリを起動

```bash
npm run dev:local
```

http://localhost:3000 を開くと、ログイン画面下部に **管理者 / マネージャー / 従業員** のクイックログインボタンが表示されます。ワンクリックで切替可能。

## 日常運用

| やりたいこと | コマンド |
|---|---|
| ローカル DB を起動（毎回） | `npm run db:start` |
| **ローカル DB で dev server 起動** | `npm run dev:local` |
| 本番 DB で dev server 起動 | `npm run dev` |
| 状態確認（URL/keys 再表示） | `npm run db:status` |
| Supabase Studio で DB 内容を見る | http://localhost:54323 をブラウザで開く |
| migrations を全リセット & 再適用 | `npm run db:reset` |
| dev ユーザーを再作成（既存はスキップ） | `npm run db:seed:dev` |
| ローカル DB 終了 | `npm run db:stop` |

`npm run dev` ↔ `npm run dev:local` の切替で本番／ローカルを行き来できます。env ファイルの書き換えは不要です。

## 注意点

- **MCP は本番固定**: `.mcp.json` の `project_ref=yyenxnnajyhrilbujuap` は本番 Supabase プロジェクトを指しています。ローカル DB には MCP コマンド（`mcp__supabase__apply_migration` 等）は届きません。ローカル DB の操作は CLI (`supabase db ...`) または Studio (http://localhost:54323) を使ってください。
- **新しいマイグレーションを書いたとき**: 通常通り `supabase/migrations/000N_xxx.sql` を作成し、`npm run db:reset` でローカル確認 → 問題なければ MCP `apply_migration` で本番反映、という流れが安全です。
- **Google カレンダー連携をローカルで試したい**: Google Cloud Console の OAuth 認可済みリダイレクト URI に `http://localhost:3000/api/calendar/callback` を追加し、`.env.docker.local` に `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` を設定。
- **Auth Confirm Email は OFF**: ローカル CLI のデフォルトでは email 確認なしでログインできます（`config.toml` の `[auth.email]` セクション）。
- **データの永続化**: Docker volume `supabase_db_*` に保存されます。`db:stop` してもデータは残ります。

## トラブルシュート

| 症状 | 対処 |
|---|---|
| `npm run db:start` でポートが既に使用中 | 別の Postgres / Supabase が動いている。`docker ps` で確認、`npm run db:stop` |
| 「Cannot connect to the Docker daemon」 | Docker Desktop が起動していない。タスクトレイから起動 |
| `npm run dev:local` で「Supabase 環境変数が未設定」 | `.env.docker.local` の URL / keys を再確認 |
| ログイン画面のクイックログインボタンが効かない | `npm run db:seed:dev` を実行したか / `.env.docker.local` の `NEXT_PUBLIC_DEV_QUICK_LOGIN_*` を確認 |
| migrations 適用で `infinite recursion` 系のエラー | DB を `npm run db:reset` でクリーンにすれば解消（順序通り適用されるため） |
| Studio (54323) で見えない | `npm run db:status` で実際のポートを確認（他プロジェクトと衝突する場合 `config.toml` の port を変更） |
