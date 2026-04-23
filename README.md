# NDS 営業ダッシュボード

社内向け営業活動支援ダッシュボード。CRM・スケジュール・売上管理・自己管理シート・歩合計算・ユーザー管理を一元化します。

- **本番**: https://nds-sales-dashboard.vercel.app
- **想定規模**: 20〜100名
- **コスト**: 〜30名は ¥0/月（Supabase Free + Vercel Hobby）

## 技術スタック

| レイヤ | 採用 |
|---|---|
| フロント | Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS |
| 認証 / DB | Supabase (Auth + Postgres + RLS) |
| 連携 | Google Calendar API（任意・後付け） |
| ホスティング | Vercel (main push で auto-deploy) |
| アイコン / トースト | `lucide-react` / `sonner` |

## クイックスタート（5 分）

前提: Node.js 20+、Supabase アカウント、Google Cloud アカウント、Vercel アカウント

```bash
# 1. クローン & 依存インストール
git clone https://github.com/nextdayssolutions/nds-sales-dashboard.git
cd nds-sales-dashboard
npm install

# 2. 環境変数設定（管理者から値をもらうか、新規構築なら docs/SETUP.md 参照）
cp .env.local.example .env.local
# .env.local を開いて 6 個の値を埋める

# 3. dev server 起動
npm run dev
```

http://localhost:3000 を開いてログイン画面が出れば OK。

> **注意**: ローカル開発でも本番と同じ Supabase DB に繋ぎます（社内利用想定）。
> 新しい商材や顧客を作ると本番にも反映されます。安易な削除等は避けてください。

## ドキュメント

| ファイル | 内容 | 対象 |
|---|---|---|
| **[CLAUDE.md](./CLAUDE.md)** | Claude Code が参照するプロジェクト規約・全機能カタログ | Claude / 開発者 |
| **[docs/SETUP.md](./docs/SETUP.md)** | Supabase / Google Cloud / Vercel の初期構築手順 | 構築者 |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | データフロー・RLS 設計・主要パターン | 設計理解したい人 |
| [docs/05-requirements.md](./docs/05-requirements.md) | 当初要件定義（参考、編集禁止） | — |
| [docs/04-setup-guide.md .md](./docs/04-setup-guide.md%20.md) | 初期コスト戦略（参考、編集禁止） | — |
| [supabase/README.md](./supabase/README.md) | DB スキーマ・マイグレーション一覧 | DB 触る人 |

## 開発コマンド

```bash
npm run dev    # localhost:3000 で起動
npm run build  # 本番ビルドのドライラン
npm run lint   # ESLint
npx tsc --noEmit  # TypeScript 型チェック（CI 相当）
```

## デプロイフロー

`main` ブランチに push すれば Vercel が自動でビルド・デプロイします。

```bash
git add -A
git commit -m "..."
git push origin main
# → 2〜3 分で https://nds-sales-dashboard.vercel.app に反映
```

`.env.local` の変更は **Vercel ダッシュボードでも別途設定が必要** です（`docs/SETUP.md` の Vercel セクション参照）。

## ロールと画面

| ロール | アクセス可能画面 | 役割 |
|---|---|---|
| `member` | `/dashboard` | 自分の CRM / 売上 / 自己管理シートの入力 |
| `manager` | `/dashboard` + `/team` | 個人入力 + 配下メンバーの閲覧・教育担当コメント |
| `admin` | `/admin` + `/dashboard` | 全社の従業員・商材管理、ユーザー招待・パスワードリセット |

## 主要機能

- **CRM**: per-user の顧客管理、ステータス管理（既存/商談中/見込み）
- **売上管理**: 商材 × 月のマトリクス、ストック/ショット区分、月次目標、達成率
- **歩合計算**: 商材ごとに歩合率（%）or 定額（円/件）。スナップショット保存で過去固定
- **自己管理シート**: 理念ビジョン・目標設定・育成計画・1on1（4 種、本人 × 教育担当の二重評価）
- **Google カレンダー連携**: 任意連携、`calendar.readonly` で予定表示
- **管理者機能**: 従業員招待・編集・削除・パスワードリセット、商材マスタ CRUD

## サポート

質問・要望・バグは GitHub の Issues または社内 Slack へ。

開発の流れと規約は `CLAUDE.md`、構築は `docs/SETUP.md`、設計の理解は `docs/ARCHITECTURE.md` を参照してください。
