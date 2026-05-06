-- ─────────────────────────────────────────────
-- 0007: customers に next_appointment_at（次回アポ日）を追加
--
-- 仕様:
--   * カレンダーで日付選択する想定の DATE カラム
--   * 未来日が入力された瞬間に UI 側で status を 'lead'(商談中) に自動切替
--   * 過去日や NULL は自動切替しない（手動で見直す方針）
-- ─────────────────────────────────────────────

ALTER TABLE public.customers
  ADD COLUMN next_appointment_at DATE;

COMMENT ON COLUMN public.customers.next_appointment_at IS '次回アポイント予定日（NULL 可）。未来日を設定すると UI で status を 商談中 に自動更新';

-- 期限切迫の顧客を絞り込む用途でインデックスを張っておく（NULL を除外して軽量化）
CREATE INDEX idx_customers_next_appointment
  ON public.customers(next_appointment_at)
  WHERE next_appointment_at IS NOT NULL;
