-- ============================================================
-- 歩合（コミッション）機能の追加
-- products.commission_rate: 商材ごとの歩合率 (%)
-- sales_records.commission_amount: 売上計上時の歩合額スナップショット（円）
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 0
  CHECK (commission_rate >= 0 AND commission_rate <= 100);

COMMENT ON COLUMN public.products.commission_rate IS
  '歩合率 (%). 売上金額に対して従業員が得るバックの割合。0.00〜100.00';

ALTER TABLE public.sales_records
  ADD COLUMN commission_amount INT NOT NULL DEFAULT 0
  CHECK (commission_amount >= 0);

COMMENT ON COLUMN public.sales_records.commission_amount IS
  '歩合額スナップショット（円）。売上登録時の商材レートに基づく計算結果を保存し、後でレートが変わっても過去実績が固定される';
