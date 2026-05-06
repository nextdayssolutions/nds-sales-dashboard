-- ─────────────────────────────────────────────
-- 0008: sheet_kind enum に 'daily' を追加
--
-- 自己管理セクションに「日報」シートを追加する。
-- personal_sheets テーブルの構造は変えず、enum 値だけ拡張する。
-- 1 ユーザー × 1 sheet_kind に集約され、daily 全エントリは
-- content JSONB 内に entries[] として保持。
-- ─────────────────────────────────────────────

ALTER TYPE sheet_kind ADD VALUE IF NOT EXISTS 'daily';
