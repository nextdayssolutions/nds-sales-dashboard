-- ============================================================
-- 歩合の種別切替: rate（率 %）/ fixed（定額円）
-- ============================================================
CREATE TYPE commission_type AS ENUM ('rate', 'fixed');

ALTER TABLE public.products
  ADD COLUMN commission_type commission_type NOT NULL DEFAULT 'rate';

ALTER TABLE public.products
  ADD COLUMN commission_fixed INT NOT NULL DEFAULT 0
  CHECK (commission_fixed >= 0);

COMMENT ON COLUMN public.products.commission_type IS
  '歩合タイプ: rate=売上に対する%, fixed=売上1件あたりの固定円';
COMMENT ON COLUMN public.products.commission_fixed IS
  '定額歩合（円/件）。commission_type=fixed のときに使用';
