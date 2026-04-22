-- ============================================================
-- 商材マスタ 初期データ
-- 管理者画面の「商材管理」タブからいつでも編集可能
-- ============================================================
INSERT INTO public.products (name, category, unit_price, is_active) VALUES
  ('SFA Pro',    'stock', 50000,  TRUE),
  ('ERP Suite',  'stock', 100000, TRUE),
  ('MA Basic',   'stock', 30000,  TRUE),
  ('POS Cloud',  'stock', 40000,  TRUE),
  ('CRM Light',  'stock', 20000,  TRUE)
ON CONFLICT DO NOTHING;
