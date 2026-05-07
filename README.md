# NDS 営業ダッシュボード

社内向け営業活動支援ダッシュボード。**CRM・スケジュール・売上管理・歩合計算・自己管理シート（日報含む 5 種）・ユーザー管理**を一元化します。

- **本番**: https://nds-sales-dashboard.vercel.app
- **想定規模**: 20〜100名
- **コスト**: 〜30名は ¥0/月（Supabase Free + Vercel Hobby）
- **開発スタイル**: Claude Code (Anthropic) 前提のリポジトリ構成 — `.mcp.json` で Supabase MCP が常時利用可能

## 技術スタック

| レイヤ | 採用 |
|---|---|
| フロント | Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS |
| 認証 / DB | Supabase (Auth + Postgres + RLS) |
| 連携 | Google Calendar API（任意・後付け） |
| ホスティング | Vercel (main push で auto-deploy) |
| アイコン / トースト | `lucide-react` / `sonner` |
| 開発支援 | Claude Code + Supabase MCP（マイグレーション・型生成を一気通貫） |

## クイックスタート（5 分）

前提: Node.js 20+、Supabase アカウント、Google Cloud アカウント、Vercel アカウント、Claude Code

```bash
# 1. クローン & 依存インストール
git clone https://github.com/nextdayssolutions/nds-sales-dashboard.git
cd nds-sales-dashboard
npm install

# 2. 環境変数設定（管理者から値をもらうか、新規構築なら docs/SETUP.md 参照）
cp .env.local.example .env.local
# .env.local を開いて値を埋める（必須 4 件 + 任意 8 件）

# 3. dev server 起動
npm run dev
```

http://localhost:3000 を開いてログイン画面が出れば OK。

### dev 環境のクイックログイン

`.env.local` に dev クイックログインの env vars を設定すると、ログイン画面下部に **管理者 / マネージャー / 従業員** の 3 ボタンが表示され、ワンクリックでサインインできます。詳細は [`CLAUDE.md`](./CLAUDE.md#-ローカル開発時のロール別クイックログイン) 参照。

> **注意**: ローカル開発でも本番と同じ Supabase DB に繋ぎます（社内利用想定）。
> 顧客や売上を作ると本番にも反映されます。安易な削除等は避けてください。
> dev テストユーザー（`@nds.test`）は本番管理画面では自動で隠蔽されます。

## ドキュメント

| ファイル | 内容 | 対象 |
|---|---|---|
| **[CLAUDE.md](./CLAUDE.md)** | Claude Code が参照するプロジェクト規約・全機能カタログ・MCP の使い方 | Claude / 開発者（**最初に読む**）|
| **[docs/SETUP.md](./docs/SETUP.md)** | Supabase / Google Cloud / Vercel の初期構築手順 | 構築者 |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | データフロー・RLS 設計・主要パターン詳解 | 設計理解したい人 |
| **[supabase/README.md](./supabase/README.md)** | DB スキーマ・マイグレーション一覧 (0001〜0011) | DB 触る人 |
| [docs/05-requirements.md](./docs/05-requirements.md) | 当初要件定義（参考、編集禁止） | — |
| [docs/04-setup-guide.md .md](./docs/04-setup-guide.md%20.md) | 初期コスト戦略（参考、編集禁止） | — |

## 開発コマンド

```bash
npm run dev    # localhost:3000 で起動
npm run build  # 本番ビルドのドライラン
npm run lint   # ESLint
npx tsc --noEmit  # TypeScript 型チェック（コミット前必須）
```

## デプロイフロー

`main` ブランチに push すれば Vercel が自動でビルド・デプロイします。

```bash
git add -A
git commit -m "..."
git push origin main
# → 2〜3 分で https://nds-sales-dashboard.vercel.app に反映
```

`.env.local` の変更は **Vercel ダッシュボードでも別途設定が必要**です。env を更新したら **Build Cache OFF で Redeploy** してください（[`docs/SETUP.md`](./docs/SETUP.md#5-vercel-本番デプロイ) の Vercel セクション参照）。

> Preview デプロイ（main 以外）も同じ本番 DB を共有します。破壊的操作は本番ブランチで慎重に。

## ロールと画面

| ロール | アクセス可能画面 | 役割 |
|---|---|---|
| `member` | `/dashboard` | 自分の CRM / 売上 / 自己管理シートの入力 |
| `manager` | `/dashboard` + `/team` | 個人入力 + 配下メンバーの閲覧・教育担当コメント |
| `admin` | `/admin` + `/dashboard` | 全社の従業員・商材管理、招待・編集・**削除**・パスワードリセット |

## 主要機能

- **CRM**: per-user の顧客管理、ステータス管理（既存/商談中/見込み）、**次回アポ日**（未来日入力で自動「商談中」化）
- **売上管理**: 商材 × 月のマトリクス、ストック/ショット区分、**個数フィールド**、**ストック自動継続**（解約月設定可）、月次目標、達成率
- **歩合計算**: 商材ごとに歩合率（%）or 定額（円/件）。スナップショット保存で過去固定。「来月の支給歩合」表示
- **自己管理シート**（5 種）:
  - 📝 日報（カレンダー UI）
  - 🟠 理念・ビジョン
  - 🔵 目標設定（**叶えたいこと × 必要月収 × PDCA** の 3 列、9 期間）
  - ⚪ 育成計画（**2ヶ月目以降は admin がカスタマイズ可**、評価ラベル「理解 / 実行」）
  - 🟣 1on1（PDCA / プライベートトピック / 業務の課題）
- **Google カレンダー連携**: 任意連携、`calendar.readonly` で予定表示
- **管理者機能**: 招待 / 編集 / 削除 / パスワードリセット、商材マスタ CRUD、**dev テストユーザーの本番自動隠蔽**

## サポート

質問・要望・バグは GitHub の Issues または社内 Slack へ。

開発の流れと規約は **[`CLAUDE.md`](./CLAUDE.md)**、構築は **[`docs/SETUP.md`](./docs/SETUP.md)**、設計の理解は **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** を参照してください。
