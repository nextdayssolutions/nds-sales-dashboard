# アーキテクチャ

このドキュメントは設計判断の理由・データフロー・主要パターンを説明します。
コード全体を効率的に理解したい開発者向け。

---

## 全体像

```
┌─────────────────────────────────────────────────────────┐
│  ブラウザ (Next.js Client Components, "use client")     │
│  ・useAuthedUser() でセッション保持                       │
│  ・useCustomers() / useSalesRecords() などで Supabase 直叩き │
│  ・モーダルは createPortal で document.body 直下に     │
└─────────────────────────────────────────────────────────┘
              │                                │
              │ Supabase JS (RLS 経由)          │ Server Action
              ▼                                ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│  Supabase            │    │  Next.js Server Actions       │
│  ・Auth (cookies)    │    │  ・app/actions/users.ts      │
│  ・public.users      │    │    (admin client = service_role) │
│  ・customers, sales, │    │  ・app/actions/calendar.ts    │
│    targets, sheets   │    │    (refresh_token 使い Google API) │
│  ・RLS policies      │    │                              │
└──────────────────────┘    └──────────────────────────────┘
                                         │
                                         ▼
                            ┌──────────────────────────┐
                            │  Google Calendar API      │
                            │  (calendar.readonly)      │
                            └──────────────────────────┘
```

---

## 認証フロー

### ログイン (Supabase Auth)

1. ユーザーが `/login` でメール/パスワード入力
2. `supabase.auth.signInWithPassword()` を client から呼ぶ
3. Supabase が JWT を発行 → cookie に保存（`@supabase/ssr` が管理）
4. `public.users` から role を取得 → admin なら `/admin`、それ以外は `/dashboard` へ

### セッション保持 (middleware)

- ルート `middleware.ts` が全リクエストに対して `lib/supabase/middleware.ts:updateSession()` を呼ぶ
- `supabase.auth.getUser()` で cookie からユーザー情報を取得し、必要なら refresh
- 未ログイン + 非公開パスへのアクセス → `/login` にリダイレクト
- ログイン済み + `/login` → `/dashboard` にリダイレクト

### useAuthedUser フック

`lib/session.ts` の `useAuthedUser()` がクライアントで:
1. `supabase.auth.getUser()` で auth.users を取得
2. `public.users` から profile を join
3. `{ session, user, loaded }` を返す（user は `UserRecord`）
4. `auth.onAuthStateChange()` で cookie 変化に追従

---

## データ層

### テーブル一覧

| テーブル | 用途 | 主要カラム |
|---|---|---|
| `auth.users` | Supabase 管理 | id, email, encrypted_password, raw_user_meta_data |
| `public.users` | プロフィール（auth.users と FK） | role, full_name, manager_id, google_refresh_token |
| `public.customers` | CRM 顧客 | owner_id, status, products (text[]) |
| `public.sales_records` | 売上レコード | owner_id, product_name, revenue_type, amount, **commission_amount** |
| `public.revenue_targets` | 月次目標 | owner_id, year, month, amount |
| `public.products` | 商材マスタ | name, category, unit_price, **commission_type, commission_rate, commission_fixed** |
| `public.personal_sheets` | 自己管理シート 4 種 | user_id, sheet_kind, content (jsonb) |
| `public.calendar_events` | Google Calendar キャッシュ（未使用） | google_event_id, start_at, end_at |
| `public.audit_logs` | 管理者操作ログ | actor_id, action, target_id, details |

詳細は `supabase/migrations/0001_init.sql` 以降を参照。

### auth.users と public.users の同期

`handle_new_user()` トリガー (0001_init.sql) が `auth.users` への INSERT を監視:

```sql
INSERT INTO public.users (id, email, full_name, role, department, title, manager_id)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
  COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'member'),
  ...
);
```

→ `auth.admin.createUser({ user_metadata: { full_name, role, ... } })` を呼ぶだけで profile が同期生成される。

### RLS (Row Level Security)

全テーブルで RLS 有効。ヘルパー関数:

| 関数 | 戻り値 |
|---|---|
| `current_user_role()` | 自分の role |
| `is_admin()` | admin ならtrue |
| `is_manager_of(uuid)` | 自分が指定ユーザーのマネージャーか |
| `can_view_user_data(uuid)` | 自分 OR admin OR その人のマネージャー |

主要ポリシー:

| テーブル | 閲覧 | 編集 |
|---|---|---|
| `users` | 自分 / admin / 配下 | 自分 (role 変更不可) / admin |
| `customers` | `can_view_user_data(owner_id)` | owner / admin |
| `sales_records` | 同上 | owner / admin |
| `revenue_targets` | 同上 | owner / admin |
| `personal_sheets` | 同上 | owner / supervisor (manager・admin) |
| `products` | ログインユーザー全員 | admin |
| `audit_logs` | admin のみ | INSERT 可（authenticated） |

**`auth.uid()` を `(SELECT auth.uid())` で包む** ことで init-plan 最適化（0004_optimize_rls_initplan.sql）。

### Server Action vs Client 直叩き

| 操作 | 実装場所 | 理由 |
|---|---|---|
| 顧客 / 売上 / シート CRUD | Client (`useCustomers` 等) | RLS で十分守られる、UX 速い |
| 商材マスタ CRUD | Client (`useProducts`) | 同上 |
| ユーザー作成 / 削除 / パスワードリセット | Server Action (`app/actions/users.ts`) | service_role が必要（RLS バイパス） |
| Google Calendar 取得 | Server Action (`app/actions/calendar.ts`) | client_secret をブラウザに出さない |

---

## 型システム

### 全 ID は string (UUID)

`types/index.ts` で:

```ts
export interface UserRecord {
  id: string;           // ← UUID
  managerId?: string;   // ← UUID
  ...
}
export interface Customer {
  id: string;
  ownerId: string;
  ...
}
export interface SalesRecord {
  id: string;
  ownerId: string;
  customerId?: string;
  commissionAmount: number;  // 歩合スナップショット (円)
  ...
}
```

過去のモック実装では数値 ID を使っていたが、Phase B で全て string (UUID) に統一済み。

### `types/supabase.ts` (自動生成)

Supabase MCP の `generate_typescript_types` で生成。`Database` 型として全テーブル / Insert / Update / Enum を export。
スキーマ変更後は再生成して上書き:

```bash
# MCP 経由 (Claude Code)
# あるいは Supabase CLI:
npx supabase gen types typescript --project-id <id> --schema public > types/supabase.ts
```

実コードでは現在 `types/supabase.ts` を直接 import してないが、将来 `Database` 型を使う際の参照源。

---

## 主要パターン

### 1. Modal Portal (fixed 位置ズレ対策)

問題: Tailwind の `animate-fade-up` などが `transform` を残すと、その内側の `position: fixed` 要素はビューポートではなく祖先を基準に配置される（CSS 仕様）。

解決: `components/common/ModalPortal.tsx` で `createPortal(children, document.body)` し、document.body 直下に描画。
全モーダル (`PasswordChangeModal`, `InviteModal`, `UserDetailModal`, `ResetPasswordModal`, `CustomerFormModal`, `SalesRecordFormModal`, `TargetEditModal`, `ProductFormModal`, `MemberViewModal`) を `<ModalPortal>` でラップ。

### 2. Metrics Single Source

問題: 担当顧客数・今月売上・達成率などを admin / manager / member 3 画面で計算すると、計算ロジックがズレて数値が一致しなくなる。

解決: `lib/metrics.ts` に集約:
- `calculateUserMetrics()` (純粋関数)
- `useUserMetrics(userId)` (per-user)
- `useAggregatedMetrics(userIds[])` (全社合算)

すべての画面はこの hook 経由でデータを取る。`UserRecord` から集計フィールドを撤去し、プロフィール専用型に整理済み。

### 3. Commission Snapshot

問題: 歩合率を後で admin が変えた時、過去の売上レコードの「歩合額」も連動して変わると給与計算で混乱する。

解決: 売上登録時に `商材の現在レート × 売上金額` を `sales_records.commission_amount` に **スナップショット保存**。
- 商材レート変更後の売上 → 新レートで計算
- 過去売上 → スナップショット値を読むだけなので不変

`lib/products-store.ts:computeCommission()` が型別の計算を担う:
```ts
if (product.commissionType === "fixed") return product.commissionFixed;
return Math.round((saleAmount * product.commissionRate) / 100);
```

### 4. Number Input Sanity

- `step={1}` で任意の整数入力可（HTML5 バリデーションをゆるくする）
- `value={n === 0 ? "" : n}` + `onChange = empty ? 0 : Number(...)` で「0 を消せない」UX 問題を解消

### 5. Currency Formatting

`lib/utils.ts:fmt()`:
- `¥0` → `—`
- `¥10,000` → `¥1万`（整数の万は小数省略）
- `¥1,980` → `¥0.2万`（小数第 1 位）

詳細表示は `fmtFull()` (`¥1,980` 等のフル表記)。

### 6. Year-aware Display

`lib/metrics.ts:CURRENT_YEAR = new Date().getFullYear()` がカレンダー年で自動切替。

`RevenuePanel` は `selectedYear` 状態を持ち、過去年データが存在すれば「年セレクタ」が表示される。
過去年閲覧モードでは「目標を編集」「売上を記録」ボタンが非表示（過去データを意図せず変更しないため）。

---

## Google Calendar 連携

### OAuth フロー

1. 従業員が `/dashboard` → スケジュールタブ → 「連携」ボタン
2. `<a href="/api/calendar/connect">` で `/api/calendar/connect` (Route Handler) へ
3. ハンドラが `auth.getUser()` で本人確認 → `state` に `user.id` を埋めて Google 認可 URL にリダイレクト
4. ユーザーが Google で承認 → `https://<app>/api/calendar/callback?code=...&state=<user_id>` に戻る
5. ハンドラが `code` を `client_secret` で token 交換 → `refresh_token` を `public.users.google_refresh_token` に保存
6. `/dashboard?calendar=connected` にリダイレクト → トースト表示

### イベント取得

`app/actions/calendar.ts:fetchCalendarEventsAction(userId)`:
1. caller の権限チェック（自分 / 配下 / admin）
2. `public.users.google_refresh_token` を service_role で取得
3. `refreshAccessToken()` で短命の access_token を取得
4. Google Calendar API `events.list` を呼ぶ（30 日分、`primary` カレンダー）
5. 整形して返す

### スコープ
`https://www.googleapis.com/auth/calendar.readonly` のみ（読み取り専用）。
予定の作成・変更・削除はアプリからは行わない。

---

## デザインシステム

- **背景**: `#080c18` (`bg-bg`) / `#0f1424` (`bg-bg-panel`)
- **アクセント**: cyan / mint / amber / coral / purple
- **フォント**: DM Sans + Noto Sans JP
- **AppShell**: variant で背景色を切替（`member`=cyan, `manager`=amber, `admin`=coral）
- **アニメ**: `animate-fade-up` (0.5s ease)

詳細は `tailwind.config.ts` と `app/globals.css`。

---

## 拡張する時のヒント

| やりたいこと | 触る場所 |
|---|---|
| 新しいテーブルを追加 | `supabase/migrations/000N_xxx.sql` 新規 → MCP で apply → 型再生成 → 対応 store を `lib/` に作る |
| 新しい Server Action | `app/actions/xxx.ts` に `"use server"` で書く。caller 認証 + 権限チェック必須 |
| 新しいモーダル | `<ModalPortal>` でラップ。z-index は `z-[100]` 〜 `z-[110]` の間 |
| KPI を追加 | `lib/metrics.ts` の `UserMetrics` 型に追加 → `calculateUserMetrics` で計算 → 画面で参照 |
| 新しいロール (例: viewer) | `0001_init.sql` の `user_role` ENUM 拡張 → RLS ポリシー見直し → `RoleGuard` の allow リスト |

スキーマ変更時の流れ:

1. `supabase/migrations/000N_xxx.sql` を作成
2. MCP の `apply_migration` で本番 DB に適用
3. `supabase/migrations/` に同じ SQL を保存（ソース一致）
4. MCP の `generate_typescript_types` で `types/supabase.ts` を再生成
5. 影響する store / 型を更新
6. `npx tsc --noEmit` で型チェック
7. commit + push（Vercel auto-deploy）
