-- ─────────────────────────────────────────────
-- 0009: sales_records に「個数」と「ストック自動継続」のための列を追加
--
-- 仕様:
--   * quantity (INT, default 1)
--       個数。歩合 fixed タイプの計算に使う（quantity × commission_fixed）
--   * end_year, end_month (nullable)
--       ストック契約の解約月（含む）。両方 NULL なら「継続中」=毎月自動計上
--       既存ストックには backfill で end_year=year, end_month=month を入れて
--       過去データの集計が壊れないようにする（手動再エントリ済みデータと整合）
--   * shot 区分のレコードでは end_year/end_month は無視（NULL のまま）
-- ─────────────────────────────────────────────

ALTER TABLE public.sales_records
  ADD COLUMN quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  ADD COLUMN end_year INT,
  ADD COLUMN end_month INT CHECK (end_month IS NULL OR (end_month BETWEEN 1 AND 12));

-- end_year / end_month は両方セットか両方 NULL のどちらか
ALTER TABLE public.sales_records
  ADD CONSTRAINT sales_end_consistent
  CHECK ((end_year IS NULL AND end_month IS NULL) OR (end_year IS NOT NULL AND end_month IS NOT NULL));

-- ストック契約の終了月は開始月以上
ALTER TABLE public.sales_records
  ADD CONSTRAINT sales_end_after_start
  CHECK (
    end_year IS NULL OR
    (end_year * 12 + end_month) >= (year * 12 + month)
  );

-- 既存のストックレコードは「単月計上」だった想定で end を start と同じに backfill。
-- これにより、これまで複数月にわたって毎月手動入力されていたデータが
-- 自動継続化により二重計上されないことを保証する。
UPDATE public.sales_records
SET end_year = year, end_month = month
WHERE revenue_type = 'stock';

-- 個数 + 継続範囲の検索を高速化（admin 集計用）
CREATE INDEX idx_sales_active_range
  ON public.sales_records(owner_id, year, month, end_year, end_month);

COMMENT ON COLUMN public.sales_records.quantity IS '個数。fixed 歩合タイプ (commission_type=fixed) で quantity × commission_fixed の計算に使用';
COMMENT ON COLUMN public.sales_records.end_year IS 'ストック契約の解約年。NULL なら継続中（毎月自動計上）';
COMMENT ON COLUMN public.sales_records.end_month IS 'ストック契約の解約月。NULL なら継続中。end_year/end_month は両方セットか両方 NULL';
