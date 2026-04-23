# CLAUDE.md

このファイルは **Claude Code** がこのリポジトリで作業する際に最初に読むガイドです。
新しい人が Claude Code を起動した時、ここと `docs/SETUP.md` `docs/ARCHITECTURE.md` を読めば全体を把握できる構成。

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

## 開発コマンド

```bash
npm run dev    # http://localhost:3000
npm run build  # 本番ビルド（CI 相当）
npm run lint   # ESLint
npx tsc --noEmit  # 型チェックのみ
```

ローカル開発も本番と同じ Supabase DB に繋ぎます（社内利用想定で環境分離なし）。

## デプロイフロー

```
git push origin main → Vercel が auto-deploy → 2〜3 分で本番反映
```

env 変更時は Vercel ダッシュボードで env を更新後 **Redeploy**（Build Cache OFF 推奨）。

## ロールとルーティング

| ロール | 画面 | 役割 |
|---|---|---|
| `member` | `/dashboard` | 自分の CRM / スケジュール / 売上 / 自己管理 |
| `manager` | `/dashboard` + `/team` | 個人入力 + 配下メンバーの閲覧（教育担当コメント可） |
| `admin` | `/admin` + `/dashboard` | 全社管理。従業員招待・編集・削除・パスワードリセット、商材管理 |

配下関係は `public.users.manager_id`。admin は配下概念を使わず `/admin` で全員を見る。

## 認証

- **メール + パスワード** (Supabase Auth)
- admin が `auth.admin.createUser` でアカウント作成、初期パスワードを Slack 等で本人に伝達（`app/actions/users.ts:createEmployeeAction`）
- Confirm email: OFF（admin 作成なので確認不要）
- Allow new users to sign up: OFF（自由登録防止）
- 本人のパスワード変更: 画面右上 🔑 ボタン (`PasswordChangeModal`)
- admin による他者リセット: `/admin` → 詳細 → 🔑 (`ResetPasswordModal` → `resetEmployeePasswordAction`)

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
  login/page.tsx                # メアド/パスワード ログイン
  dashboard/page.tsx            # 個人ダッシュボード（全ロール共通）
  team/page.tsx                 # マネージャー専用チームビュー
  admin/page.tsx                # 管理者専用
  layout.tsx                    # ルートレイアウト（DM Sans + Noto Sans JP）
  page.tsx                      # / → /login リダイレクト
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
    CRMPanel.tsx                # 顧客リスト + ステータス絞込 + 詳細パネル
    CustomerFormModal.tsx       # 顧客の新規/編集/削除
    SchedulePanel.tsx           # Google カレンダー連携 + 30 日分の予定表示
    RevenuePanel.tsx            # 商材 × 月 マトリクス + 歩合サマリー + 年セレクタ
    SalesRecordFormModal.tsx    # 売上レコードの新規/編集（歩合自動計算）
    TargetEditModal.tsx         # 月次目標の編集（年間総額の自動分配機能）
  team/
    TeamMemberRow, TeamMemberDetail
  admin/
    UserTable.tsx               # 従業員一覧（検索 / role 絞込）
    UserRowProgress.tsx         # 行内 KPI（達成率・育成進捗）
    UserDetailModal.tsx         # 5 タブ（基本情報 / CRM / スケジュール / 売上 / 自己管理）
    ResetPasswordModal.tsx      # admin による他者パスワードリセット
    InviteModal.tsx             # 従業員招待（Server Action 経由）
    ProductsTable.tsx           # 商材マスタ CRUD（歩合タイプ + 値）
  members/
    MemberDashboardTabs.tsx     # CRM / スケジュール / 売上 / 自己管理 4 タブの共通実装
    MemberViewModal.tsx         # manager 用の readonly 閲覧モーダル（amber アクセント）
  sheets/
    SheetPanel.tsx              # 4 シート切替
    VisionSheet, GoalSheet, DevelopmentSheet, OneOnOneSheet
    primitives.tsx              # Field / EvalCheck / ReadOnlyBanner

lib/
  utils.ts                      # cn() / fmt() / fmtFull() / fmtDate()
  session.ts                    # useAuthedUser() — Supabase Auth + public.users 統合
  curriculum-data.ts            # xlsx 準拠の育成カリキュラム定数 + emptyXxx() ファクトリ
  customer-store.ts             # useCustomers() — Supabase customers CRUD
  sales-store.ts                # useSalesRecords / useRevenueTargets / useAllRevenueTargets
  sheet-storage.ts              # useSheet() / getAllSheetsAsync() — personal_sheets (JSONB)
  products-store.ts             # useProducts() / computeCommission()
  user-store.ts                 # useAllUsers / useTeamMembers / useUser
  metrics.ts                    # useUserMetrics / useAggregatedMetrics + CURRENT_YEAR
  google-oauth.ts               # OAuth トークン交換 / refresh ヘルパー
  supabase/
    env.ts                      # 環境変数 + isSupabaseConfigured 判定
    server.ts                   # createClient (RLS 経由) / createAdminClient (service_role)
    client.ts                   # createBrowserClient
    middleware.ts               # updateSession() — cookie refresh + 未ログインリダイレクト

middleware.ts                   # ルート middleware（`lib/supabase/middleware.ts:updateSession` 呼ぶ）
types/
  index.ts                      # 全 ID が string (UUID) の型
  supabase.ts                   # Supabase MCP で自動生成された Database 型

supabase/
  migrations/0001_init.sql                          # 全テーブル + RLS + トリガー + ヘルパー
  migrations/0002_seed_products.sql                 # 商材初期データ（任意）
  migrations/0003_harden_function_search_path.sql   # SECURITY DEFINER 強化
  migrations/0004_optimize_rls_initplan.sql         # RLS init-plan 最適化
  migrations/0005_add_commission_fields.sql         # 歩合カラム追加
  migrations/0006_commission_type_and_fixed.sql     # 歩合タイプ + 定額
  README.md

docs/
  SETUP.md                      # 構築手順（メイン）
  ARCHITECTURE.md               # 設計詳解
  01〜05 / .xlsx                # 当初設計資料（編集禁止）
```

## 主要機能カタログ

### CRM（顧客管理）
- per-user の顧客リスト（`customers.owner_id`）
- ステータス: 既存 / 商談中 / 見込み（DB enum: existing / lead / prospect）
- 関係値スコア (0-10) の RelationDots 可視化
- 商材紐付け（`customers.product_names text[]`）
- `lib/customer-store.ts:useCustomers()` で CRUD

### 売上管理
- **商材 × 月 のマトリクス** UI（`RevenuePanel`）
- ストック / ショット 区分（`revenue_type` enum）
- 商材の `category` に応じて行表示を絞る（ストック商材ならストック行のみ）
- 月次目標 + 年間達成率 + 残り月平均
- セルクリックで明細リスト + 売上追加
- **年セレクタ**で過去年閲覧可（過去年は readonly）
- KPI: 年間目標 / 現在実績 / 達成率 / 残り月平均
- 売上レコードに紐づく顧客名表示

### 歩合（コミッション）
- 商材ごとに **タイプ + 値** を設定:
  - `rate` (%): 売上に対する割合（例: 10%）
  - `fixed` (円/件): 1 件あたりの固定額（例: ¥5,000）
- 売上登録時に自動計算（`computeCommission()`）→ `sales_records.commission_amount` に**スナップショット保存**
- 手動オーバーライド可（特殊歩合用）
- 表示:
  - `/dashboard` KPI に「今月の歩合」（mint）
  - `/admin` KPI に「合計今月歩合」（全社合算）
  - `RevenuePanel` に「今月の歩合 / ◯年累計歩合」サマリー（売上があれば表示）
- スナップショット方式により、後で歩合率を変えても過去レコードは固定

### 自己管理シート
4 シート（`docs/採用後初期フォーマット.xlsx` 準拠）:

| シート | 内容 | 色 |
|---|---|---|
| 🟠 理念・ビジョン | 基本情報 + 人生理念 ①②③ | オレンジ |
| 🔵 目標設定 | 時間軸 × 叶えたいこと + キャリアマップ（5 階層） | シアン |
| ⚪ 育成計画 | マインド/ポータブル/テクニカル 3 カテゴリ + 6 ヶ月カリキュラム。本人 × 教育担当の二重評価 | ニュートラル |
| 🟣 1on1 | 月次エントリ（体調・プライベート・キャリア・業務不安・振り返り）+ マネージャーコメント | パープル |

権限:
- **本人**: 全シート編集可
- **manager / admin** (`readonly=true, trainerMode=true`): 育成の「教育担当」列 + 1on1「コメント」のみ編集可、他は閲覧

ストレージ: `public.personal_sheets.content` (JSONB)。`useSheet(userId, kind)` で読み書き。

### Google カレンダー
- 任意連携。`SchedulePanel` に「Google カレンダーを連携」ボタン
- 連携後は今後 30 日の予定を日付別に表示（タイトル / 時刻 / 場所 / 参加者数 / Google へのリンク）
- 解除も画面から（refresh_token を NULL に）
- admin/manager は配下メンバーの予定を閲覧可（連携済みメンバーのみ）

### 管理者機能
- 従業員一覧（検索 / role 絞込）
- 詳細モーダル 5 タブ: 基本情報 / CRM / スケジュール / 売上 / 自己管理
- 招待モーダル: メール / 氏名 / 部署 / 役職 / ロール / マネージャー / 初期パスワード（自動生成 16 桁）
- パスワードリセット
- 商材マスタ CRUD（タイプ + 歩合値）
- KPI: 総従業員 / 合計今月売上 / 合計今月歩合 / 合計担当顧客 / 平均達成率

## 権限マトリクス

| 機能 | member 本人 | manager 配下 | admin 全員 |
|---|---|---|---|
| 個人ダッシュボード | 編集 | 編集（自分のみ） | 編集（自分のみ） |
| CRM | 自分の顧客を CRUD | 閲覧のみ | 閲覧のみ |
| スケジュール | 連携 / 閲覧 | 閲覧 | 閲覧 |
| 売上管理 | CRUD + 月次目標 | 閲覧 | 閲覧 |
| 自己管理シート | 編集 | 閲覧 + 教育担当列・1on1 コメント | 同 manager |
| ユーザー招待 / 編集 / 削除 | — | — | `/admin` |
| 商材マスタ | — | — | `/admin` の「商材管理」 |
| パスワードリセット（他者） | — | — | UserDetailModal |

閲覧モーダルの一貫性:
- **manager `/team` → MemberViewModal**（amber、4 タブ）
- **admin `/admin` → UserDetailModal**（coral、5 タブ）
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

## 主要パターン（再掲、詳細は ARCHITECTURE.md）

### Modal Portal
`animate-fade-up` などが残す `transform` で fixed 位置がズレる。`<ModalPortal>{children}</ModalPortal>` で `document.body` 直下にレンダー。

### Metrics Single Source
admin / manager / member 3 画面の数値ズレを防ぐため `lib/metrics.ts` の `useUserMetrics()` / `useAggregatedMetrics()` に集約。`UserRecord` から集計フィールドを撤去。

### Commission Snapshot
売上登録時に商材レートで歩合額を計算 → `sales_records.commission_amount` に保存。後で歩合率を変えても過去レコードは不変（給与計算の整合性）。

### Year-aware Display
`CURRENT_YEAR = new Date().getFullYear()` で自動切替。`RevenuePanel` は `selectedYear` 状態で過去年閲覧可（過去年モードでは編集ボタン非表示）。

### Currency Formatting
`fmt()` は `¥0` → `—`、`¥10,000` → `¥1万`、`¥1,980` → `¥0.2万`、`¥153,000` → `¥15.3万`。
詳細表示は `fmtFull()` (`¥1,980`)。

## デザインシステム

- **背景**: `#080c18` (`bg-bg`) / パネル `#0f1424` (`bg-bg-panel`)
- **アクセント色**: cyan `#00D4FF` / mint `#00E5A0` / amber `#FFB830` / coral `#FF6B6B` / purple `#B794F4`
- **フォント**: DM Sans + Noto Sans JP（`next/font/google`）
- **角丸**: `rounded-xl` (14px) / `rounded-2xl` (16px) / `rounded-3xl` (20px) を多用
- **背景効果**: 48px グリッド + 角の radial-gradient グロー（`AppShell` が描画）
- **アニメ**: `animate-fade-up` (0.5s ease)
- **管理者画面**: `<AppShell variant="admin">` で coral 系の背景に切替
- **マネージャー画面**: `variant="manager"` で amber 系

## 環境変数

詳細は [docs/SETUP.md](./docs/SETUP.md#7-環境変数-完全リファレンス)。サマリ:

| 変数名 | 必須 | 公開可否 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | OK |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **NG** |
| `GOOGLE_OAUTH_CLIENT_ID` | △ | OK |
| `GOOGLE_OAUTH_CLIENT_SECRET` | △ | **NG** |
| `NEXT_PUBLIC_APP_URL` | ✅ | OK |

`.env.local.example` をコピーして使う。`.env.local` は `.gitignore` 済。

## DB スキーマ要約

詳細は [supabase/README.md](./supabase/README.md) と migrations/。

主要テーブル:
- `auth.users` (Supabase 管理) ←→ `public.users`（プロフィール、`google_refresh_token` も持つ）
- `public.customers` (per-owner CRM)
- `public.sales_records` (売上 + 歩合スナップショット)
- `public.revenue_targets` (月次目標)
- `public.products` (商材マスタ + 歩合定義)
- `public.personal_sheets` (4 シート、JSONB content)
- `public.audit_logs` (admin 操作監査)

ヘルパー関数: `current_user_role()` / `is_admin()` / `is_manager_of(uuid)` / `can_view_user_data(uuid)` をすべての RLS で活用。

## よくある作業のヒント

| やりたいこと | 触る場所 |
|---|---|
| 新しいテーブル追加 | `supabase/migrations/000N_xxx.sql` 作成 → MCP `apply_migration` → 型再生成 → 対応 store を `lib/` に |
| 新しい Server Action | `app/actions/xxx.ts` に `"use server"` で定義。caller 認証 + 権限チェック必須 |
| 新しいモーダル | `<ModalPortal>` でラップ。z-index は `z-[100]`〜`z-[110]` |
| KPI 追加 | `lib/metrics.ts` の `UserMetrics` 型に追加 → `calculateUserMetrics` で計算 → 各画面で参照 |
| 新しいロール | `0001_init.sql` の `user_role` ENUM 拡張 → RLS 見直し → `RoleGuard` の allow リスト |
| 表示金額の単位を変える | `lib/utils.ts:fmt()` を編集（全画面に波及） |

## 注意点 / 既知の挙動

- **ローカル = 本番 DB 共有**: 環境分離していない。社内利用想定で「ローカルで触ったら本番にも反映される」。重要操作は慎重に
- **Supabase Free の 7 日停止**: 1 週間誰もアクセスしないと一時停止する。GitHub Actions の keep-alive workflow で対策可（`docs/SETUP.md` 6-6 参照、まだ未実装）
- **Google OAuth Production 100 ユーザー上限**: それ以上は Google 検証申請が必要（プライバシーポリシー URL 等が要る）
- **`raw_user_meta_data` の `role`**: signup 時に任意値を渡せるため、`Allow new users to sign up: OFF` 必須（admin 経由のみで作成される）
- **モバイル対応**: 部分的に対応。完全レスポンシブではない（PC 業務向け）

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| ログインしても画面が変わらない | env が dev server に反映されてない。Ctrl+C → `npm run dev` |
| `redirect_uri_mismatch` | Google Cloud Console のリダイレクト URI が完全一致してない |
| Google OAuth `access_denied` | OAuth 同意画面が「テスト」のまま。「アプリを公開」 |
| モーダルが上にはみ出る | `<ModalPortal>` でラップしていない |
| 売上が `0万` | `fmt()` 古い実装の名残。`lib/utils.ts` 確認 |
| 0 を消せない number input | `value={n===0?"":n}` パターンになっているか |

詳しくは [docs/SETUP.md](./docs/SETUP.md#8-トラブルシューティング) も参照。

## Claude Code への指示

- ユーザーから新機能依頼があったら、まずこのファイル・`docs/ARCHITECTURE.md`・関連 store / component を読んで現状を把握してから提案
- DB スキーマ変更は **新規 migration ファイルを作る**（既存ファイル編集 NG）
- 型変更時は `npx tsc --noEmit` でパスを確認
- 大きな変更は commit 前に `npm run build` でビルド確認
- env を含む値の echo 禁止（チャットログに残るため）
- 商業的に重要な操作（DB 削除、本番デプロイ等）は必ずユーザーに確認
