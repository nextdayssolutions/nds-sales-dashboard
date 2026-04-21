# 無料プラン運用セットアップガイド（20人規模）

## 前提条件
- 社内ユーザー: 20名程度
- Google Workspace利用中
- 社内エンジニア1〜2名で構築・運用

## 月額コスト
**¥0 / 月**（向こう2〜3年継続可能）

---

## 1. 初期セットアップ

### 1-1. Supabase 無料プロジェクト作成
- https://supabase.com でアカウント作成（Google アカウント利用可）
- 新規プロジェクト作成 → Region: **Northeast Asia (Tokyo)** を選択
- プロジェクト名: `sales-dashboard-prod` など
- データベースパスワードは**1passwordなどで厳重管理**

### 1-2. Vercel 無料アカウント作成
- https://vercel.com でアカウント作成（GitHub連携推奨)
- Hobby プランで開始
- 独自ドメインは後から無料で追加可能

### 1-3. Google Cloud Console 設定（SSO用）
- OAuth 2.0 クライアント作成
- 承認済みリダイレクトURI に Supabase の callback URL を登録
- Supabase の Authentication 設定に Client ID / Secret を貼付

---

## 2. 自動停止回避の設定

**重要**: Supabase無料プランは7日間アクセスがないと停止するため、保険を設定します。

### GitHub Actions による週次ピング
`.github/workflows/keep-alive.yml`:

```yaml
name: Supabase Keep Alive
on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜 9:00 UTC
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -X GET "${{ secrets.SUPABASE_URL }}/rest/v1/users?select=id&limit=1" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}"
```

これで完全に自動停止を回避できます（無料）。

---

## 3. バックアップ戦略

### 手動バックアップ（管理者が週次で実施）
Supabase Dashboard → Database → Backups からSQL dump をダウンロード

### 自動バックアップ（推奨）
GitHub Actions で週次でダンプを取得し、プライベートリポジトリに保存：

```yaml
name: Weekly DB Backup
on:
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曜 深夜
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install pg_dump
        run: sudo apt-get install postgresql-client
      - name: Backup DB
        run: |
          pg_dump "${{ secrets.SUPABASE_DB_URL }}" > backup_$(date +%Y%m%d).sql
      - name: Commit backup
        run: |
          git config user.name "backup-bot"
          git config user.email "bot@example.com"
          git add backup_*.sql
          git commit -m "Weekly backup $(date +%Y-%m-%d)"
          git push
```

これで**週次の自動バックアップが無料で実現**できます。

---

## 4. 監視・アラート

### Supabase 組み込み監視
Dashboard から以下を定期確認:
- Database size（500MB接近で警告）
- API リクエスト数
- エラーログ

### 無料の外部監視（推奨）
- **UptimeRobot**（無料）: 5分おきにアプリURLをチェック、ダウン時メール通知
- **Vercel Analytics**（Hobby に含まれる）: アクセス状況

---

## 5. 有料化の判断基準

以下のいずれかに該当したら Supabase Pro ($25/月) への移行を検討:

- [ ] 従業員が50人を超えた
- [ ] DB容量が400MBに達した（500MBの80%）
- [ ] 日次バックアップが業務上必須になった
- [ ] 本番障害発生時、Supabaseサポートが必要と判断
- [ ] コンプライアンス監査でSLAが求められた
- [ ] 複数環境（本番・ステージング）の分離が必要

移行はダウンタイムなしで可能（管理画面からプラン変更のみ）。

---

## 6. セキュリティ必須設定

無料プランでも以下は必ず設定:

- [x] Google SSO 強制（パスワードログイン無効化）
- [x] Row Level Security を全テーブルで有効化
- [x] 管理者アカウントに2要素認証（GoogleアカウントでMFA）
- [x] API キーは環境変数で管理（コードにハードコード禁止）
- [x] データベースパスワードは1passwordなどで保管
- [x] Vercel の環境変数は Production / Preview を分離

---

## 7. スケーリング時の移行パス

将来従業員が増えた際のコスト推移:

| 規模 | プラン | 月額 |
|---|---|---|
| 〜30名 | Supabase Free + Vercel Hobby | ¥0 |
| 30〜80名 | Supabase Pro + Vercel Hobby | ¥3,800 |
| 80名以上 | Supabase Pro + Vercel Pro | ¥6,800 |
| 200名以上 | Supabase Team or Self-hosted を検討 | ¥10,000+ |

段階的に移行できるので、最初から有料プランに入る必要はありません。
