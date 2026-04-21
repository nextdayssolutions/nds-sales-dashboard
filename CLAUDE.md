# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際のガイドです。コンテキストは常に `docs/` を参照してください（仕様の正本はあちら）。

## プロジェクト概要

社内向け営業活動支援ダッシュボード。20名規模から開始し、50〜100名までスケール予定。

- **仕様書**: `docs/05-requirements.md`
- **DB スキーマ**: `docs/03-db-schema.sql`（Supabase で実行）
- **UI リファレンス**: `docs/01-ui-member-dashboard.jsx` / `docs/02-ui-admin-dashboard.jsx`
- **セットアップガイド**: `docs/04-setup-guide.md .md`

## 技術スタック

- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS（shadcn/ui は未導入 — 必要になったら追加）
- Supabase (PostgreSQL + Auth + RLS) ※ フェーズ1 Step 5 以降で接続
- Vercel (Hobby) デプロイ
- アイコン: `lucide-react`
- トースト: `sonner`

## 進捗（現状）

### 完了 ✅
- Step 0: Next.js 14 スキャフォールド
- Step 1: デザイントークン（Tailwind config + globals.css）
- Step 2: ログイン画面（モック Google SSO + 3ロールクイック切替）
- Step 3: メンバーダッシュボード `/dashboard`（CRM / スケジュール / 売上 / 自己管理 の4タブ、per-user KPI）
- Step 4: 管理者ダッシュボード `/admin`（統計・従業員テーブル・招待モーダル・**5タブ** ユーザー詳細モーダル）
- Step 4.5: マネージャービュー `/team`（配下メンバーのチーム統計・テーブル・詳細・全ダッシュボード閲覧モーダル）
- Step 4.6: 自己管理シート4種（理念ビジョン / 目標設定 / 育成計画 / 1on1）xlsx 準拠のカリキュラム移植・二重評価・manager コメント
- Step 4.7: 顧客データを per-user 化（ownerId）、CRM 新規登録/編集/削除、ステータス3種（既存/商談中/見込み）のピル UI、localStorage 永続化
- Step 4.8: 管理者・マネージャーから任意メンバーの **CRM / スケジュール / 売上 / 自己管理** を横断的に閲覧（`MemberViewModal` / admin 5タブモーダル）
- Step 4.9: 売上管理を **商材 × 月 のマトリクス** に刷新。ストック/ショット区分で記録、月次目標と達成率、年間累計、セルクリックで明細リスト + 追加、MRR 可視化
- モックセッション管理（`lib/session.ts`）でロール別ナビ・ログアウト対応

### 未着手 ⏳
- Step 5: Supabase プロジェクト作成＋スキーマ適用＋型生成
- Step 6: Google SSO 実接続（`@supabase/ssr` + middleware.ts + /auth/callback）
- Step 7: 招待フロー Server Action（`auth.admin.inviteUserByEmail`）
- Step 8: CRM 顧客管理を RLS 経由の実データに差し替え

## ディレクトリ構造

```
/app
  /login/page.tsx             # ログイン画面（モック・3ロール切替）
  /dashboard/page.tsx         # 個人ダッシュボード（全ロール共通）
  /team/page.tsx              # マネージャー専用チームビュー
  /admin/page.tsx             # 管理者専用
  layout.tsx                  # ルートレイアウト（DM Sans + Noto Sans JP・SheetSeeder）
  page.tsx                    # / → /login リダイレクト
/components
  /layout/AppShell.tsx        # 背景グリッド + グローオーブ（member/manager/admin）
  /layout/RoleNav.tsx         # ロール別相互リンク + ログアウト
  /layout/RoleGuard.tsx       # クライアント側ルートガード（モック用）
  /layout/SheetSeeder.tsx     # 初回マウントでサンプルシートを localStorage へ投入
  /common/                    # RelationDots, MiniBar, CircleProgress
  /dashboard/                 # CRMPanel, SchedulePanel, RevenuePanel
  /team/                      # TeamMemberRow, TeamMemberDetail
  /admin/                     # UserTable, UserRowProgress, UserDetailModal, InviteModal
  /sheets/                    # VisionSheet, GoalSheet, DevelopmentSheet, OneOnOneSheet, SheetPanel, primitives
  /members/                   # MemberDashboardTabs, MemberViewModal（readonly 横断閲覧）
  /dashboard/                 # CRMPanel, SchedulePanel, RevenuePanel, CustomerFormModal
/lib
  utils.ts                    # cn(), fmt(), fmtFull(), fmtDate()
  session.ts                  # モック: useMockSession / getTeamMembers
  mock-data.ts                # CUSTOMERS(28件 per-owner) / MONTHLY_REVENUE / MOCK_USERS
  curriculum-data.ts          # xlsx 準拠の育成カリキュラム定数 + emptyXxx() ファクトリ
  customer-store.ts           # localStorage ベースの useCustomers() / CRUD
  sales-store.ts              # useSalesRecords() + useRevenueTargets()
  sales-seed.ts               # 過去4ヶ月の売上レコードと目標を自動生成
  sheet-storage.ts            # localStorage ベースの useSheet() / evalSubmissionStatus()
  sheet-seed.ts               # 田中/山田のサンプルシートを初回投入
/types/index.ts               # 共通型（SheetSet / VisionSheet / GoalSheet / DevelopmentSheet / OneOnOneSheet 等）
/docs                         # 設計資料（編集禁止）
```

Step 5 以降で追加予定:
```
/lib/supabase/              # server.ts / client.ts / middleware.ts
/app/api/                   # API Routes（必要に応じて）
/app/auth/callback/route.ts # OAuth コールバック
/middleware.ts              # セッション保護
/types/supabase.ts          # Supabase から自動生成
```

## デザインシステム

- **背景色**: `#080c18`（`bg-bg` / `bg-bg-panel`）
- **アクセント**: cyan `#00D4FF`、mint `#00E5A0`、amber `#FFB830`、coral `#FF6B6B`、purple `#B794F4`
- **フォント**: DM Sans + Noto Sans JP（`next/font/google`）
- **角丸**: 10px〜20px を多用（Tailwind の `rounded-xl` / `rounded-2xl` / `rounded-3xl`）
- **背景効果**: 48px グリッド + 角の radial-gradient グロー（`AppShell` が担当）
- **カード**: `rgba(255,255,255,0.04)` + 薄いボーダー
- **アニメ**: `animate-fade-up`（0.5s ease）、`cubic-bezier(0.4,0,0.2,1)` 中心

管理者画面は `AppShell variant="admin"` を渡すとグリッドとオーブが赤系になります。

## コーディング方針

- **Server Components を優先**。`"use client"` は state/event が必要な時だけ。
- **Server Actions** でデータ変更（Step 7 以降）。
- **TypeScript strict**。`any` は使わない。
- **コメントは日本語 OK**、変数・関数名は英語。
- **エラーハンドリング**: try-catch + `sonner` の toast。
- **権限チェック**: Supabase RLS を正、サーバー側で二重チェック。

## 権限マトリクス（モック実装 / Step 5 以降 RLS で担保）

| 機能 | member 本人 | manager 配下 | admin 全員 | 閲覧導線 |
|---|---|---|---|---|
| 個人ダッシュボード（自分の） | 編集 | 編集（自分のみ） | 編集（自分のみ） | `/dashboard` |
| CRM（顧客） | 自分の顧客を登録/編集/削除 | 閲覧のみ | 閲覧のみ | manager: `/team` → メンバー詳細 → ダッシュボード全体<br>admin: `/admin` → 詳細 → CRM タブ |
| スケジュール | 閲覧（Calendar 連携予定） | 閲覧 | 閲覧 | 同上 |
| 売上管理 | 商材×月のマトリクスで**記録・編集・削除**、ストック/ショット区分、月次目標設定 | 閲覧 | 閲覧 | 同上 |
| 自己管理シート | 編集 | 閲覧 + 育成計画の「教育担当」列 + 1on1 コメント | 同 manager | 同上 |
| ユーザー招待 | — | — | `/admin` → 招待モーダル | |

**閲覧モーダルの一貫性**:
- manager `/team` → **MemberViewModal**（amber アクセント、4タブ: CRM/スケジュール/売上/自己管理）
- admin `/admin` → **UserDetailModal**（coral アクセント、5タブ: 基本情報 + 同じ4タブ）
- いずれも `MemberDashboardTabs` / `CRMPanel(readonly)` / `SheetPanel(readonly, trainerMode)` を共有

## 自己管理シートの仕組み

**4シート** は `docs/採用後初期フォーマット.xlsx` 準拠:
| シート | 内容 | 色 |
|---|---|---|
| 🟠 理念・ビジョン | 基本情報 + 人生理念 ①②③ | オレンジ |
| 🔵 目標設定 | 時間軸×叶えたいこと + キャリアマップ（5階層） | シアン |
| ⚪ 育成計画 | マインド/ポータブル/テクニカル 3カテゴリ + 6ヶ月カリキュラム。本人×教育担当 の二重評価（理解/できている） | ニュートラル |
| 🟣 1on1シート | 月次エントリ（体調・プライベート・キャリア・業務不安・振り返り）+ マネージャーコメント | パープル |

### 権限モード
`SheetPanel` コンポーネントの `readonly` / `trainerMode` で切替:
- **本人**: 全シートを編集可
- **マネージャー**（`/team` 経由）: `readonly=true, trainerMode=true` → 育成計画の「教育担当」列と 1on1「コメント」のみ編集可、他は閲覧
- **管理者**（`/admin` ユーザー詳細モーダル経由）: 同上（trainer として扱う）

### ストレージ（モック）
`localStorage: sheet-v1:{userId}:{kind}` で保持。`lib/sheet-seed.ts` が田中（新人サンプル）/山田（完了済みマネージャー）を初回投入。Step 5 以降では Supabase の `personal_sheets` テーブル（`content JSONB`）に移行。

## ロールとルーティング

| ロール | アクセス可能画面 | 説明 |
|---|---|---|
| `member` | `/dashboard` | 自分の CRM / スケジュール / 売上 / 育成 |
| `manager` | `/dashboard` + `/team` | 自分も営業担当として入力しつつ、`/team` で配下の状況を**閲覧のみ** |
| `admin` | `/admin` + `/dashboard` | 全従業員の管理・招待・編集（admin は `/team` に入らず `/admin` で全員を見る） |

- 配下関係は `users.manager_id` (= モックでは `UserRecord.managerId`) で表現
- マネージャーは個人ダッシュボードを普通に使い、ヘッダーの「チーム」リンクで `/team` に切替
- admin は配下概念を使わず「全社の管理者」として `/admin` で横串閲覧
- モック実装は `localStorage` 経由 (`lib/session.ts`)。Step 6 以降で Supabase Auth + middleware に置換

## 開発コマンド

```
npm run dev    # http://localhost:3000
npm run build  # 本番ビルド
npm run lint   # ESLint
```

動作確認は `/login` → モックの「従業員として開く」「管理者として開く」から。

## モックデータから実データへの移行方針

現在は `lib/mock-data.ts` の定数を各ページで直接 import しています。Step 5 以降は以下の順で実データ化:

1. `lib/supabase/server.ts` / `client.ts` を作成
2. Server Component では `createServerClient()` でフェッチ → RLS 任せ
3. 更新は Server Action（ファイル先頭 `"use server"`）で `createServerClient()` 経由
4. ダミーデータに対応する SQL INSERT を `supabase/seed.sql` として保存しておくと開発が楽

## よくある注意点

- **`docs/04-setup-guide.md .md`** はファイル名に半角スペースが入っているが docs 側の既存ファイル。命名は変えない。
- **`lucide-react`** は 2025 年に 1.0.0 メジャーアップ済み。現時点のインストール版は `1.x`（旧 `0.577.0` の続き）。
- **Supabase Free プランの 7 日停止回避** は `.github/workflows/keep-alive.yml` で対応（Step 5 と合わせて追加）。
