# CLAUDE.md

このファイルは **Claude Code** がこのリポジトリで作業する際に最初に読むガイドです。
新しい人が Claude Code を起動した時、ここと `docs/SETUP.md` `docs/ARCHITECTURE.md` を読めば全体を把握できる構成。

> **前提**: このプロジェクトは Claude Code で開発を進めることを想定しています。Supabase MCP 経由で DB 操作・マイグレーション適用・型生成までシームレスに実行できる環境が整っています。

## プロジェクト概要

社内営業活動支援ダッシュボード。**本番稼働中**: https://nds-sales-dashboard.vercel.app

- **規模**: 20 名から開始、50〜100 名までスケール想定
- **コスト**: 〜30 名は ¥0/月（Supabase Free + Vercel Hobby）
- **GitHub**: `nextdayssolutions/nds-sales-dashboard`（Public — Hobby プランで private org がデプロイできない制約回避）
- **Supabase Project ID**: `yyenxnnajyhrilbujuap`
- **Region**: Northeast Asia (Tokyo)

## 関連ドキュメント

| ファイル | 内容 |
|---|---|
| [README.md](./README.md) | プロジェクト入り口（5 分で起動）|
| [docs/SETUP.md](./docs/SETUP.md) | Supabase / Google Cloud / Vercel の構築手順 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | データフロー・RLS・主要パターン |
| [supabase/README.md](./supabase/README.md) | DB スキーマ・マイグレーション一覧 |
| docs/01〜05（数字始まり） | 当初設計資料（**編集禁止**、参考情報） |

## 技術スタック

- **Next.js 14** (App Router) + **TypeScript strict**
- **Tailwind CSS**（shadcn/ui は未導入）
- **Supabase** (PostgreSQL + Auth + RLS + 任意の Edge Functions)
- **Vercel** (Hobby) — main push で auto-deploy
- **lucide-react** (アイコン) / **sonner** (トースト) / **@supabase/ssr** + **@supabase/supabase-js**
- **next/image** + `app/icon.png` でファビコン自動生成、`public/nds-logo*.png` でブランディング

## 開発コマンド

```bash
npm run dev    # http://localhost:3000
npm run build  # 本番ビルド（CI 相当）
npm run lint   # ESLint
npx tsc --noEmit  # 型チェックのみ（コミット前必須）
```

ローカル開発も**本番と同じ Supabase DB に繋ぎます**（社内利用想定で環境分離なし）。

---

## ⚡ Claude Code + Supabase MCP の使い方（重要）

このリポジトリには `.mcp.json` で **Supabase MCP サーバ**が設定されています。Claude Code 起動時に自動でマウントされ、以下が **Claude から直接呼べます**:

### MCP の主要コマンド（Claude が呼ぶ）

| ツール | 用途 |
|---|---|
| `mcp__supabase__list_tables` | スキーマ確認（事前必須）|
| `mcp__supabase__list_migrations` | 適用済みマイグレーション一覧 |
| `mcp__supabase__apply_migration` | マイグレーション適用（DDL）|
| `mcp__supabase__execute_sql` | 任意 SQL 実行（読み取り・調査）|
| `mcp__supabase__generate_typescript_types` | `types/supabase.ts` を再生成 |
| `mcp__supabase__get_logs` | Supabase ログ参照（auth / api / postgres）|
| `mcp__supabase__get_advisors` | セキュリティ・パフォーマンス警告 |

### 初回認証フロー（新規開発者の最初の 1 回だけ）

Claude Code を起動して MCP コマンドを呼ぼうとすると、未認証ならまず認証を求められます:

1. Claude が `mcp__supabase__authenticate` を実行 → 認証 URL を提示
2. その URL をブラウザで開く → Supabase でログイン → 認可
3. リダイレクト先 (`http://localhost:47971/callback?code=...&state=...`) は **接続できないエラー画面が出ます（正常）**
4. **ブラウザのアドレスバーから完全な URL をコピー**して Claude のチャットに貼る
5. Claude が `mcp__supabase__complete_authentication` で完了 → 以降のセッションは MCP コマンドが使える

### 推奨ワークフロー: スキーマ変更

```
[ユーザー]「customers に next_appointment_at カラム追加して」

  ↓ Claude が:
1. mcp__supabase__list_tables で現状確認
2. supabase/migrations/000N_xxx.sql を作成
3. mcp__supabase__apply_migration で本番 DB 反映
4. types/index.ts と types/supabase.ts を更新
5. 関連 store / component を更新
6. npx tsc --noEmit で型チェック
7. git commit + push
```

### MCP 利用上の注意

- `apply_migration` は **本番 DB を直接変更**します。実行前にユーザーに内容確認を取ること
- DDL は冪等性を意識（`IF NOT EXISTS`, `IF EXISTS` を活用）
- マイグレーションファイルは `supabase/migrations/000N_xxx.sql` として **必ず**コミットする（DB の正本）
- `execute_sql` は読み取り中心。重要な書き込みは migration ファイルにする

---

## ⚡ ローカル開発時のロール別クイックログイン

`npm run dev` で起動したログイン画面下部に **管理者 / マネージャー / 従業員** の 3 ボタンが表示され、**ワンクリックでサインイン**できます。

### 仕組み

| 環境 | ボタン表示 | テストユーザー (admin 画面) | 仕組み |
|---|:---:|:---:|---|
| `npm run dev` (NODE_ENV=development) | ✅ | ✅ 見える | env vars + 専用ユーザー |
| Vercel 本番 (NODE_ENV=production) | ❌ | ❌ 隠蔽 | フィルタで除外 |

### 専用テストユーザー（DB に作成済）

| Email | Password | Role |
|---|---|---|
| `dev-admin@nds.test` | `devpass1234` | admin |
| `dev-manager@nds.test` | `devpass1234` | manager |
| `dev-member@nds.test` | `devpass1234` | member |

`@nds.test` ドメインなので本番ユーザー (`@nextdays-solutions.com`) と完全に区別。`lib/dev-users.ts:isDevTestEmail()` で判定して本番管理画面・KPI から自動除外。

### 環境変数（`.env.local`）

```bash
NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_EMAIL=dev-admin@nds.test
NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_PASSWORD=devpass1234
NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_EMAIL=dev-manager@nds.test
NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_PASSWORD=devpass1234
NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_EMAIL=dev-member@nds.test
NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_PASSWORD=devpass1234
```

`.env.local.example` にコメントアウトされた状態で記載。`.env.local` は gitignore 済（コミットされない）。**Vercel の本番環境にこれらの env vars を設定しないこと**。

### 防御層

万一テストアカウントの credentials が漏れても、本番ログインは **`performSignIn` で `@nds.test` を NODE_ENV=production 時に拒否**するので侵入できません。

---

## デプロイフロー（Vercel）

### 基本

```
git push origin main → Vercel が auto-deploy → 2〜3 分で本番反映
```

- main ブランチが Vercel の Production
- 他のブランチに push すると Preview デプロイが走る（**Preview も同じ本番 DB に繋がる**ので注意）
- Vercel ダッシュボード: https://vercel.com/nextdayssolutions/nds-sales-dashboard

### env 変更時のフロー

1. Vercel ダッシュボード → Settings → Environment Variables で値を更新
2. **Build Cache OFF** で Redeploy（古いバンドルに env が焼き込まれないように）
3. デプロイ完了後、ハードリロード（Ctrl+F5）でブラウザキャッシュもクリア

### Vercel 関連の注意点

- **`NEXT_PUBLIC_*`** な env vars は**ビルド時にバンドルに焼き込まれる**。設定漏れは Redeploy が必要
- **`SUPABASE_SERVICE_ROLE_KEY`** は server only。`NEXT_PUBLIC_` を絶対に付けない
- **CDN キャッシュ**: 古い JS バンドルが配信されることがある。問題が解決しないように見えたら Ctrl+Shift+R でハードリロード
- **Preview デプロイ**: ブランチ毎に URL が発行される。本番 DB 共有なので機能テストはできるが破壊的操作は避ける

## ロールとルーティング

| ロール | 画面 | 役割 |
|---|---|---|
| `member` | `/dashboard` | 自分の CRM / スケジュール / 売上 / 自己管理（日報含む 5 シート） |
| `manager` | `/dashboard` + `/team` | 個人入力 + 配下メンバーの閲覧（教育担当コメント可） |
| `admin` | `/admin` + `/dashboard` | 全社管理。従業員招待・編集・**削除**・パスワードリセット、商材管理 |

配下関係は `public.users.manager_id`。admin は配下概念を使わず `/admin` で全員を見る。

## 認証

- **メール + パスワード** (Supabase Auth)
- admin が `auth.admin.createUser` でアカウント作成、初期パスワードを Slack 等で本人に伝達（`app/actions/users.ts:createEmployeeAction`）
- Confirm email: OFF（admin 作成なので確認不要）
- Allow new users to sign up: OFF（自由登録防止）
- 本人のパスワード変更: 画面右上 🔑 ボタン (`PasswordChangeModal`)
- admin による他者リセット: `/admin` → 詳細 → 🔑 (`ResetPasswordModal` → `resetEmployeePasswordAction`)
- admin による従業員削除: `/admin` → 詳細 → 🗑 (`UserDetailModal` 内の確認モーダル → `deleteEmployeeAction`)
  - 自分自身・他の admin は削除不可（UI で非表示）
  - 確認には対象者氏名のタイピングが必要

## Google カレンダー連携

- ログインとは独立した別 OAuth フロー
- スコープ: `calendar.readonly`（閲覧のみ）
- `/api/calendar/connect` → Google 認可 → `/api/calendar/callback` → `public.users.google_refresh_token` に保存
- Cloud Console は External + 本番環境（未検証）。100 ユーザー累積まで verification 不要
- 各従業員が任意で連携。未連携でも他機能は普通に使える
- イベント取得は `app/actions/calendar.ts:fetchCalendarEventsAction`（自分 / 配下 / admin が閲覧可）

## ディレクトリ構造

```
app/
  login/page.tsx                # メアド/パスワード ログイン + DEV ロール別クイックログインパネル
  dashboard/page.tsx            # 個人ダッシュボード（全ロール共通）
  team/page.tsx                 # マネージャー専用チームビュー
  admin/page.tsx                # 管理者専用（「全社分析」「監査ログ」は準備中タブ）
  layout.tsx                    # ルートレイアウト（DM Sans + Noto Sans JP）
  page.tsx                      # / → /login リダイレクト
  icon.png                      # Next.js が自動でファビコン化
  api/calendar/{connect,callback}/route.ts  # Google OAuth Route Handler
  actions/
    users.ts                    # createEmployee / updateEmployee / resetPassword / deleteEmployee
    calendar.ts                 # fetchCalendarEventsAction / disconnectCalendarAction

components/
  layout/
    AppShell.tsx                # 背景グリッド + グローオーブ（variant=member/manager/admin で色変化）
    RoleNav.tsx                 # ロール別相互リンク + パスワード + ログアウト
    RoleGuard.tsx               # クライアント側ルートガード（useAuthedUser ベース）
  common/
    RelationDots, MiniBar, CircleProgress
    ModalPortal.tsx             # createPortal で document.body 直下に描画（fixed 位置ズレ対策）
    PasswordChangeModal.tsx     # 本人パスワード変更
  dashboard/
    CRMPanel.tsx                # 顧客リスト + ステータス絞込 + 詳細パネル（フィルタ切替で詳細自動クローズ）
    CustomerFormModal.tsx       # 顧客の新規/編集/削除（次回アポ日 + 自動「商談中」ロジック）
    SchedulePanel.tsx           # Google カレンダー連携 + 30 日分の予定表示
    RevenuePanel.tsx            # 商材 × 月 マトリクス + 歩合サマリー + 年セレクタ常時表示
    SalesRecordFormModal.tsx    # 売上レコード（個数 / ストック自動継続 / 解約月 / 来月支給歩合）
    TargetEditModal.tsx         # 月次目標の編集（年間総額の自動分配機能）
  team/
    TeamMemberRow, TeamMemberDetail
  admin/
    UserTable.tsx               # 従業員一覧（検索 / role 絞込 / @nds.test を本番では除外）
    UserRowProgress.tsx         # 行内 KPI（達成率・育成進捗）
    UserDetailModal.tsx         # 5 タブ + 削除ボタン（氏名タイピング確認）
    ResetPasswordModal.tsx      # admin による他者パスワードリセット
    InviteModal.tsx             # 従業員招待（Server Action 経由）
    ProductsTable.tsx           # 商材マスタ CRUD（歩合タイプ + 値）
  members/
    MemberDashboardTabs.tsx     # CRM / スケジュール / 売上 / 自己管理 4 タブの共通実装
    MemberViewModal.tsx         # manager 用の readonly 閲覧モーダル（amber アクセント）
  sheets/
    SheetPanel.tsx              # 5 シート切替（日報を最左に）
    DailySheet.tsx              # 📝 日報（カレンダー UI + エントリ編集）
    VisionSheet.tsx             # 🟠 理念・ビジョン
    GoalSheet.tsx               # 🔵 目標設定（PDCA 構造、3列カード × 9 期間）
    DevelopmentSheet.tsx        # ⚪ 育成計画（2ヶ月以降は admin カスタマイズ可）
    OneOnOneSheet.tsx           # 🟣 1on1（PDCA / プライベートトピック / 業務の課題）
    primitives.tsx              # Field / EvalCheck / ReadOnlyBanner

lib/
  utils.ts                      # cn() / fmt() / fmtFull() / fmtDate()
  session.ts                    # useAuthedUser() — Supabase Auth + public.users 統合
  curriculum-data.ts            # xlsx 準拠の育成カリキュラム + COMMON/CUSTOM 期間 + emptyXxx() ファクトリ
  customer-store.ts             # useCustomers() — Supabase customers CRUD（next_appointment_at 含む）
  sales-store.ts                # useSalesRecords / useRevenueTargets / useAllRevenueTargets（年フィルタが stock 継続を考慮）
  sales-recurrence.ts           # ★ ストック自動継続の単一ソース (isActiveInMonth, sumActiveAmount, ...)
  sheet-storage.ts              # useSheet() / getAllSheetsAsync() — personal_sheets (JSONB)
  products-store.ts             # useProducts() / computeCommission(qty 対応)
  user-store.ts                 # useAllUsers / useTeamMembers / useUser（本番では @nds.test を除外）
  metrics.ts                    # useUserMetrics / useAggregatedMetrics + CURRENT_YEAR
  google-oauth.ts               # OAuth トークン交換 / refresh ヘルパー
  dev-users.ts                  # ★ DEV テストユーザー判定（isDevTestEmail / shouldHideDevTestUsers）
  supabase/
    env.ts                      # 環境変数 + isSupabaseConfigured 判定
    server.ts                   # createClient (RLS 経由) / createAdminClient (service_role)
    client.ts                   # createBrowserClient
    middleware.ts               # updateSession() — cookie refresh + 未ログインリダイレクト

middleware.ts                   # ルート middleware（`lib/supabase/middleware.ts:updateSession` 呼ぶ）

types/
  index.ts                      # 全 ID が string (UUID) の型
  supabase.ts                   # Supabase MCP で自動生成された Database 型

public/
  nds-logo.png                  # NDS カラーロゴ（基本利用）
  nds-logo-white.png            # NDS 白透かしロゴ（ログイン画面で浮上演出）

supabase/
  migrations/                   # 番号順実行（詳細は supabase/README.md）
  README.md

docs/
  SETUP.md                      # 構築手順（メイン）
  ARCHITECTURE.md               # 設計詳解
  01〜05 / .xlsx                # 当初設計資料（編集禁止）

.mcp.json                       # Claude Code 用 Supabase MCP 設定
.env.local.example              # env テンプレ
```

## 主要機能カタログ

### CRM（顧客管理）
- per-user の顧客リスト（`customers.owner_id`）
- ステータス: 既存 / 商談中 / 見込み（DB enum: existing / lead / prospect）
- 関係値スコア (0-10) の RelationDots 可視化
- 商材紐付け（`customers.product_names text[]`）
- **次回アポ日**（`customers.next_appointment_at DATE`）— 未来日入力で status を自動「商談中」化
- ステータスフィルタ切替時、選択中の顧客が新フィルタに含まれなければ詳細パネル自動クローズ
- `lib/customer-store.ts:useCustomers()` で CRUD

### 売上管理（ストック自動継続対応）
- **商材 × 月 のマトリクス** UI（`RevenuePanel`）
- ストック / ショット 区分（`revenue_type` enum）
- 商材の `category` に応じて行表示を絞る（ストック商材ならストック行のみ）
- **個数 (`quantity`)** 入力 — 単価×個数で売上自動計算、fixed 歩合は qty × 固定額
- **ストック自動継続**: 1 度登録すると毎月自動計上、解約月（`end_year, end_month`）を設定するまで継続
- 集計ロジックは `lib/sales-recurrence.ts` に集約（`isActiveInMonth` / `sumActiveAmount` 等）
- 月次目標 + 年間達成率 + 残り月平均
- セルクリックで明細リスト + 売上追加（継続中バッジ / 解約済バッジ表示）
- **年セレクタ常時表示**（前年・来年もすぐ切替可能、過去年は readonly）
- KPI: 年間目標 / 現在実績 / 達成率 / 残り月平均
- **顧客選択は廃止**（集計のブレ防止）

### 歩合（コミッション）
- 商材ごとに **タイプ + 値** を設定:
  - `rate` (%): 売上に対する割合（例: 10%）
  - `fixed` (円/件): 1 件あたりの固定額（例: ¥5,000）→ qty 倍され
- 売上登録時に自動計算（`computeCommission(product, amount, quantity)`）→ `sales_records.commission_amount` に**スナップショット保存**
- 手動オーバーライド可（特殊歩合用）
- ストックは月額の歩合として毎月計上
- 表示:
  - `/dashboard` KPI に **「来月の支給歩合」**（mint）
  - `/admin` KPI に **「合計来月支給歩合」**（全社合算）
  - `RevenuePanel` に「来月の支給歩合（今月分） / ◯年累計歩合」サマリー
- スナップショット方式により、後で歩合率を変えても過去レコードは固定

### 自己管理シート（5 種）
| シート | 内容 | 色 | DB |
|---|---|---|---|
| 📝 日報 | カレンダー UI から日付選択 → 当日の活動・成果・気付き・翌日タスク + マネージャーコメント | 緑 (mint) | `personal_sheets.sheet_kind = 'daily'` |
| 🟠 理念・ビジョン | 基本情報 + 人生理念 ①②③ | オレンジ | `vision` |
| 🔵 目標設定 | 1ヶ月後〜未来の各時点で **叶えたいこと × 必要月収/キャリア × アクションプラン (PDCA)** の 3 列カード（9 期間） | シアン | `goal` |
| ⚪ 育成計画 | マインド/ポータブル/テクニカル 3 カテゴリ + 6 ヶ月カリキュラム。**入社〜45日は共通レール、2ヶ月目以降は admin がカスタマイズ可（項目編集/追加/削除）**。評価: 「理解」「実行」 | ニュートラル | `development` |
| 🟣 1on1 | 月次エントリ（体調 / プライベートトピック / キャリア / 業務の課題 / **PDCA（結果・成長・タスク）**）+ マネージャーコメント | パープル | `oneonone` |

#### 権限
- **本人**: 全シート編集可
- **manager / admin** (`readonly=true, trainerMode=true`):
  - 育成シートの「教育担当（trainer）」列のみ編集可
  - 1on1 / 日報の **マネージャーコメント** のみ編集可（**本人は閲覧のみ**）
  - admin は育成計画の 2ヶ月以降のカスタム期間で項目編集・追加・削除可

#### ストレージ
`public.personal_sheets.content` (JSONB)。`useSheet(userId, kind)` で読み書き。
RLS は `sheets_owner_write` (本人) + `sheets_supervisor_modify` (admin/manager) で対称。

### Google カレンダー
- 任意連携。`SchedulePanel` に「Google カレンダーを連携」ボタン
- 連携後は今後 30 日の予定を日付別に表示（タイトル / 時刻 / 場所 / 参加者数 / Google へのリンク）
- 解除も画面から（refresh_token を NULL に）
- admin/manager は配下メンバーの予定を閲覧可（連携済みメンバーのみ）

### 管理者機能
- 従業員一覧（検索 / role 絞込）
  - **本番では `@nds.test` ユーザーを自動除外**（dev クイックログインのテストユーザーを隠す）
- 詳細モーダル 5 タブ: 基本情報 / CRM / スケジュール / 売上 / 自己管理
- 招待モーダル: メール / 氏名 / 部署 / 役職 / ロール / マネージャー / 初期パスワード（自動生成 16 桁）
- パスワードリセット
- **従業員削除**（自分自身・他 admin は不可、氏名タイピング確認）
- 商材マスタ CRUD（タイプ + 歩合値）
- KPI: 総従業員 / 合計今月売上 / **合計来月支給歩合** / 合計担当顧客 / 平均達成率
- 「全社分析」「監査ログ」タブは現在「準備中」

## 権限マトリクス

| 機能 | member 本人 | manager 配下 | admin 全員 |
|---|---|---|---|
| 個人ダッシュボード | 編集 | 編集（自分のみ） | 編集（自分のみ） |
| CRM | 自分の顧客を CRUD | 閲覧のみ | 閲覧のみ |
| スケジュール | 連携 / 閲覧 | 閲覧 | 閲覧 |
| 売上管理 | CRUD + 月次目標 | 閲覧 | 閲覧 |
| 自己管理シート（本人列） | 編集 | 閲覧 | 閲覧 |
| 育成計画「教育担当」列 | 閲覧 | 編集 | 編集 |
| **マネージャーコメント (1on1 / 日報)** | **閲覧のみ** | **編集** | **編集** |
| 育成計画 2ヶ月以降のカスタム編集 | — | — | **編集（管理者のみ）** |
| ユーザー招待 / 編集 / 削除 | — | — | `/admin` |
| 商材マスタ | — | — | `/admin` の「商材管理」 |
| パスワードリセット（他者） | — | — | UserDetailModal |

閲覧モーダルの一貫性:
- **manager `/team` → MemberViewModal**（amber、4 タブ）
- **admin `/admin` → UserDetailModal**（coral、5 タブ + 削除ボタン）
- いずれも `MemberDashboardTabs` を共有

## コーディング方針

- **TypeScript strict**。`any` 禁止
- **`"use client"` は state / event / browser API が必要な時だけ**。それ以外はサーバーコンポーネント
- **データ変更は Server Action**（`app/actions/`）または client 直接 + RLS（CRUD 系）
  - admin 操作（service_role 必須）は必ず Server Action
- **エラーハンドリング**: try-catch + `sonner` の `toast.error/.success`
- **権限チェック**: Supabase RLS を正、Server Action で二重チェック
- **コメントは日本語 OK**、変数・関数名は英語
- **全 ID は string (UUID)**（`UserRecord.id`, `Customer.id`, `SalesRecord.ownerId` など）
- **モーダルは `<ModalPortal>` でラップ**（`transform` 祖先による fixed 位置ズレ対策）
- **数値入力は `step={1}` + `value={n===0?"":n}` パターン**（HTML5 step バリデーションで弾かれないように、0 を消せるように）
- **金額表示は `fmt()` (¥0.5万 など) と `fmtFull()` (¥1,980 など) を使い分け**
- **画像は `next/image`** で最適化、`public/` 配下から `/path` で参照

## 主要パターン

### Modal Portal
`animate-fade-up` などが残す `transform` で fixed 位置がズレる。`<ModalPortal>{children}</ModalPortal>` で `document.body` 直下にレンダー。

### Metrics Single Source
admin / manager / member 3 画面の数値ズレを防ぐため `lib/metrics.ts` の `useUserMetrics()` / `useAggregatedMetrics()` に集約。`UserRecord` から集計フィールドを撤去。

### Stock Recurrence Single Source（NEW）
ストックの「ある月にアクティブか」「年合計はいくらか」の判定は **`lib/sales-recurrence.ts` に集約**。
全画面・集計でこのヘルパーを使う:
- `isActiveInMonth(record, year, month)` — 計上対象判定
- `sumActiveAmount` / `sumActiveCommission` / `sumYearAmount` / `sumYearCommission`
- `isOpenSubscription(record)` — 継続中判定

仕様: shot は単月、stock は `(year, month) ≤ target ≤ (end_year, end_month or ∞)`。
既存ストックは migration 0009 で `end_year=year, end_month=month` を backfill 済（過去データの二重計上を防止）。

### Commission Snapshot
売上登録時に商材レートで歩合額を計算 → `sales_records.commission_amount` に保存。後で歩合率を変えても過去レコードは不変（給与計算の整合性）。
個数 (`quantity`) もスナップショットされる。

### Year-aware Display
`CURRENT_YEAR = new Date().getFullYear()` で自動切替。`RevenuePanel` は `selectedYear` 状態で過去年閲覧可（過去年モードでは編集ボタン非表示）。**年プルダウンは常時表示**（過去レコードがなくても）。

### Currency Formatting
`fmt()` は `¥0` → `—`、`¥10,000` → `¥1万`、`¥1,980` → `¥0.2万`、`¥153,000` → `¥15.3万`。
詳細表示は `fmtFull()` (`¥1,980`)。

### DEV テストユーザーの隠蔽
`@nds.test` ドメインのユーザーは本番ビルド (`NODE_ENV === "production"`) で:
- `useAllUsers` の返り値から除外（→ admin 画面・manager 画面・KPI から消える）
- ログインフォームから手動サインインも拒否（防御層）
ローカル dev では全部見える（管理・確認・削除可）。

## デザインシステム

- **背景**: `#080c18` (`bg-bg`) / パネル `#0f1424` (`bg-bg-panel`)
- **アクセント色**: cyan `#00D4FF` / mint `#00E5A0` / amber `#FFB830` / coral `#FF6B6B` / purple `#B794F4`
- **フォント**: DM Sans + Noto Sans JP（`next/font/google`）
- **角丸**: `rounded-xl` (14px) / `rounded-2xl` (16px) / `rounded-3xl` (20px) を多用
- **背景効果**: 48px グリッド + 角の radial-gradient グロー（`AppShell` が描画）
- **アニメ**: `animate-fade-up` (0.5s) / **`animate-rise-glow`** (ログイン画面のロゴ浮上演出)
- **管理者画面**: `<AppShell variant="admin">` で coral 系の背景に切替
- **マネージャー画面**: `variant="manager"` で amber 系
- **ロゴ**: `/nds-logo.png` (カラー) と `/nds-logo-white.png` (白透かし) を使い分け
- **ファビコン**: `app/icon.png` を Next.js が自動でブラウザタブのアイコンに変換

## 環境変数

詳細は [docs/SETUP.md](./docs/SETUP.md#7-環境変数-完全リファレンス)。サマリ:

### 必須
| 変数名 | 公開可否 | 用途 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | OK | Supabase エンドポイント |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | OK | client SDK 用 |
| `SUPABASE_SERVICE_ROLE_KEY` | **NG** | Server Actions の admin 操作用 |
| `NEXT_PUBLIC_APP_URL` | OK | OAuth callback URL 計算 |

### 任意（Google カレンダー連携を使うなら）
| 変数名 | 公開可否 |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | OK |
| `GOOGLE_OAUTH_CLIENT_SECRET` | **NG** |

### 任意（ローカル開発のクイックログイン）
| 変数名 | 公開可否 |
|---|---|
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_EMAIL` | OK（dev のみ）|
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_ADMIN_PASSWORD` | dev のみ |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_EMAIL` | OK（dev のみ）|
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MANAGER_PASSWORD` | dev のみ |
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_EMAIL` | OK（dev のみ）|
| `NEXT_PUBLIC_DEV_QUICK_LOGIN_MEMBER_PASSWORD` | dev のみ |

`.env.local.example` をコピーして使う。`.env.local` は `.gitignore` 済。
**dev quick login の env vars は Vercel 本番環境に絶対設定しない。**

## DB スキーマ要約

詳細は [supabase/README.md](./supabase/README.md) と migrations/。

主要テーブル:
- `auth.users` (Supabase 管理) ←→ `public.users`（プロフィール、`google_refresh_token` も持つ）
- `public.customers` (per-owner CRM、`next_appointment_at` 含む)
- `public.sales_records` (売上 + 歩合スナップショット + `quantity` + `end_year/end_month`)
- `public.revenue_targets` (月次目標)
- `public.products` (商材マスタ + 歩合定義 rate/fixed)
- `public.personal_sheets` (5 シート daily/vision/goal/development/oneonone, JSONB content)
- `public.audit_logs` (admin 操作監査、actor 削除時 SET NULL)

ヘルパー関数: `current_user_role()` / `is_admin()` / `is_manager_of(uuid)` / `can_view_user_data(uuid)` をすべての RLS で活用。

FK 削除動作 (migration 0010 で整備):
- `customers.owner_id` / `sales_records.owner_id` → CASCADE（従業員削除で消える）
- `audit_logs.actor_id` → SET NULL（履歴は保持）
- `users.manager_id` → SET NULL（配下は孤児にしない）
- `personal_sheets.user_id` / `revenue_targets.owner_id` / `calendar_events.user_id` → CASCADE

## よくある作業のヒント

| やりたいこと | 触る場所 |
|---|---|
| **新しいテーブル / カラム追加** | `supabase/migrations/000N_xxx.sql` 作成 → MCP `apply_migration` → MCP `generate_typescript_types` で `types/supabase.ts` 再生成 → `types/index.ts` に追加 → 対応 store を `lib/` に |
| **新しい Server Action** | `app/actions/xxx.ts` に `"use server"` で定義。caller 認証 + 権限チェック必須 |
| **新しいモーダル** | `<ModalPortal>` でラップ。z-index は `z-[100]`〜`z-[110]` |
| **KPI 追加** | `lib/metrics.ts` の `UserMetrics` 型に追加 → `calculateUserMetrics` で計算 → 各画面で参照 |
| **新しいロール** | `0001_init.sql` の `user_role` ENUM 拡張 → RLS 見直し → `RoleGuard` の allow リスト |
| **表示金額の単位を変える** | `lib/utils.ts:fmt()` を編集（全画面に波及） |
| **dev テストユーザー追加 / 削除** | admin 画面の「+ 招待」 or SQL `DELETE FROM auth.users WHERE email LIKE 'dev-%@nds.test'` |
| **ストック計算ロジック修正** | `lib/sales-recurrence.ts` を編集（全画面に波及）|

## 注意点 / 既知の挙動

- **ローカル = 本番 DB 共有**: 環境分離していない。社内利用想定で「ローカルで触ったら本番にも反映される」。重要操作は慎重に
- **Supabase Free の 7 日停止**: 1 週間誰もアクセスしないと一時停止する。GitHub Actions の keep-alive workflow で対策可（`docs/SETUP.md` 6-6 参照、まだ未実装）
- **Google OAuth Production 100 ユーザー上限**: それ以上は Google 検証申請が必要（プライバシーポリシー URL 等が要る）
- **`raw_user_meta_data` の `role`**: signup 時に任意値を渡せるため、`Allow new users to sign up: OFF` 必須（admin 経由のみで作成される）
- **モバイル対応**: 部分的に対応。完全レスポンシブではない（PC 業務向け）
- **既存ストックの月次手入力データ**: migration 0009 で `end = start` に backfill しているので二重計上は防いでいるが、「自動継続」の恩恵を受けたい場合は最古レコードを「継続中に戻す」+ 後続を削除して統合
- **fixed 歩合 × ストック**: 現実装は active な各月で `qty × commission_fixed` を毎月支給。一回限りのサインアップ報酬として扱いたい場合は別途仕様調整必要

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| ログインしても画面が変わらない | env が dev server に反映されてない。Ctrl+C → `npm run dev` |
| `redirect_uri_mismatch` | Google Cloud Console のリダイレクト URI が完全一致してない |
| Google OAuth `access_denied` | OAuth 同意画面が「テスト」のまま。「アプリを公開」 |
| モーダルが上にはみ出る | `<ModalPortal>` でラップしていない |
| 売上が `0万` | `fmt()` 古い実装の名残。`lib/utils.ts` 確認 |
| 0 を消せない number input | `value={n===0?"":n}` パターンになっているか |
| **admin が他人のシート保存に失敗** | `personal_sheets` の RLS が UPDATE のみで INSERT 不可になってる可能性。migration 0011 で対応済 |
| **dev クイックログインのボタンが出ない** | `.env.local` に `NEXT_PUBLIC_DEV_QUICK_LOGIN_*` を設定して **dev server 再起動** |
| **本番デプロイ後に変更が反映されない** | (1) Vercel デプロイ完了確認 (2) ハードリロード (Ctrl+Shift+R) で CDN キャッシュ回避 (3) Build Cache OFF で Redeploy |
| **本番管理画面に DEV ユーザーが見える** | `lib/dev-users.ts:shouldHideDevTestUsers()` が機能してるか。NODE_ENV を再確認 |
| MCP コマンドが「未認証」エラー | `mcp__supabase__authenticate` を呼んで再認証 |
| 従業員削除で FK エラー | migration 0010 が適用されているか確認（FK 削除動作の整備）|

詳しくは [docs/SETUP.md](./docs/SETUP.md#8-トラブルシューティング) も参照。

## Claude Code への指示

- **常にこのファイル + `supabase/README.md` を最初に読む** — マイグレーション一覧やヘルパー関数の存在を把握
- ユーザーから新機能依頼があったら、関連 store / component を読んで現状を把握してから提案
- **DB スキーマ変更は新規 migration ファイルを作る**（既存ファイル編集 NG）→ MCP `apply_migration` → 型再生成
- 型変更時は `npx tsc --noEmit` でパスを確認（コミット前必須）
- 大きな変更は commit 前に `npm run build` でビルド確認
- **env を含む値の echo 禁止**（チャットログに残るため）
- **商業的に重要な操作（DB 削除、本番デプロイ、ユーザー削除等）は必ずユーザーに確認**
- ストック・歩合・自己管理シート関連の修正は **`lib/sales-recurrence.ts` / `lib/metrics.ts` の単一ソースを優先**して編集すれば全画面に波及する
- マイグレーション適用後は **`supabase/README.md` のマイグレーション一覧表も更新**する
