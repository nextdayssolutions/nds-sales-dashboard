-- ============================================================
-- 営業ダッシュボード 初期スキーマ
-- 実装した4機能（CRM / スケジュール / 売上管理 / 自己管理シート）+ 認証 + 商材管理
-- ============================================================

-- ─────────────────────────────────────────────
-- ENUMs
-- ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE customer_status AS ENUM ('prospect', 'lead', 'existing');
-- prospect=見込み, lead=商談中, existing=既存
CREATE TYPE revenue_type AS ENUM ('stock', 'shot');
CREATE TYPE sheet_kind AS ENUM ('vision', 'goal', 'development', 'oneonone');
CREATE TYPE product_category AS ENUM ('stock', 'shot', 'both', 'other');

-- ─────────────────────────────────────────────
-- 1. users（auth.users と紐付く公開プロフィール）
-- ─────────────────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  department TEXT,
  title TEXT,
  manager_id UUID REFERENCES public.users(id),
  hired_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  google_refresh_token TEXT,  -- カレンダー連携用（暗号化推奨）
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_manager ON public.users(manager_id);
CREATE INDEX idx_users_role ON public.users(role);

-- ─────────────────────────────────────────────
-- 2. products（管理者管理の商材マスタ）
-- ─────────────────────────────────────────────
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category product_category,
  unit_price INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_active ON public.products(is_active);

-- ─────────────────────────────────────────────
-- 3. customers（CRM 顧客）
-- ─────────────────────────────────────────────
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  industry TEXT,
  status customer_status NOT NULL DEFAULT 'prospect',
  relation_score INT CHECK (relation_score BETWEEN 0 AND 10) DEFAULT 5,
  last_contact_at DATE,
  -- 導入商材は名前配列で持つ（products.name 参照、削除されても残す）
  product_names TEXT[] NOT NULL DEFAULT '{}',
  annual_revenue INT NOT NULL DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_owner ON public.customers(owner_id);
CREATE INDEX idx_customers_status ON public.customers(status);

-- ─────────────────────────────────────────────
-- 4. sales_records（月次・商材別の売上レコード）
-- ─────────────────────────────────────────────
CREATE TABLE public.sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  -- 商材は名前で保持（products 削除/改名後も過去データを保持）
  product_name TEXT NOT NULL,
  revenue_type revenue_type NOT NULL,
  amount INT NOT NULL CHECK (amount >= 0),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  memo TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_owner_period ON public.sales_records(owner_id, year, month);
CREATE INDEX idx_sales_customer ON public.sales_records(customer_id);
CREATE INDEX idx_sales_product ON public.sales_records(product_name);

-- ─────────────────────────────────────────────
-- 5. revenue_targets（月次目標）
-- ─────────────────────────────────────────────
CREATE TABLE public.revenue_targets (
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_id, year, month)
);

-- ─────────────────────────────────────────────
-- 6. personal_sheets（自己管理シート 4種）
-- vision / goal / development / oneonone（後者は entries 配列を content に）
-- ─────────────────────────────────────────────
CREATE TABLE public.personal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sheet_kind sheet_kind NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sheet_kind)
);

-- ─────────────────────────────────────────────
-- 7. calendar_events（Google カレンダー キャッシュ）
-- ─────────────────────────────────────────────
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  title TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  event_type TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, google_event_id)
);

CREATE INDEX idx_calendar_user_period ON public.calendar_events(user_id, start_at);

-- ─────────────────────────────────────────────
-- 8. audit_logs（管理者操作の記録）
-- ─────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_targets_updated BEFORE UPDATE ON public.revenue_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sheets_updated BEFORE UPDATE ON public.personal_sheets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- auth.users → public.users 自動同期
-- admin が auth.admin.createUser に渡した user_metadata から profile を作る
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, department, title, manager_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member'),
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'title',
    NULLIF(NEW.raw_user_meta_data->>'manager_id', '')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ヘルパー関数
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.current_user_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_manager_of(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = target_user_id AND manager_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 「自分 OR 自分が管理者 OR その対象ユーザーのマネージャー」
CREATE OR REPLACE FUNCTION public.can_view_user_data(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    target_user_id = auth.uid()
    OR public.is_admin()
    OR public.is_manager_of(target_user_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Row Level Security （全テーブル有効化）
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ─────────── users ───────────
CREATE POLICY "users_self_select" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.is_manager_of(id)
  );

CREATE POLICY "users_admin_all" ON public.users
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.users WHERE id = auth.uid()));
  -- 本人は role を変更できない

-- ─────────── products ───────────
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────── customers ───────────
CREATE POLICY "customers_select_visibility" ON public.customers
  FOR SELECT USING (public.can_view_user_data(owner_id));

CREATE POLICY "customers_owner_modify" ON public.customers
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "customers_admin_modify" ON public.customers
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────── sales_records ───────────
CREATE POLICY "sales_select_visibility" ON public.sales_records
  FOR SELECT USING (public.can_view_user_data(owner_id));

CREATE POLICY "sales_owner_modify" ON public.sales_records
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "sales_admin_modify" ON public.sales_records
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────── revenue_targets ───────────
CREATE POLICY "targets_select_visibility" ON public.revenue_targets
  FOR SELECT USING (public.can_view_user_data(owner_id));

CREATE POLICY "targets_owner_modify" ON public.revenue_targets
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "targets_admin_modify" ON public.revenue_targets
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─────────── personal_sheets ───────────
-- 閲覧: 自分 / 配下 / admin
CREATE POLICY "sheets_select_visibility" ON public.personal_sheets
  FOR SELECT USING (public.can_view_user_data(user_id));

-- 本人だけが書ける（教育担当の評価は content JSONB の専用キーに保存して、
-- アプリ側で「本人エリア」と「教育担当エリア」を分離する設計）
CREATE POLICY "sheets_owner_write" ON public.personal_sheets
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- マネージャー / admin は教育担当評価 + 1on1 コメントを書くため、UPDATE は許可
CREATE POLICY "sheets_supervisor_update" ON public.personal_sheets
  FOR UPDATE USING (
    public.is_admin() OR public.is_manager_of(user_id)
  ) WITH CHECK (
    public.is_admin() OR public.is_manager_of(user_id)
  );

-- ─────────── calendar_events ───────────
CREATE POLICY "calendar_select_visibility" ON public.calendar_events
  FOR SELECT USING (public.can_view_user_data(user_id));

CREATE POLICY "calendar_owner_write" ON public.calendar_events
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────── audit_logs ───────────
CREATE POLICY "audit_admin_select" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "audit_authenticated_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
