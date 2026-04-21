-- ============================================================
-- 社内営業ダッシュボード DBスキーマ (Supabase / PostgreSQL)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. 従業員マスタ
-- ─────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE user_status AS ENUM ('active', 'invited', 'suspended', 'retired');

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  status user_status NOT NULL DEFAULT 'invited',
  department TEXT,
  manager_id UUID REFERENCES public.users(id),
  hired_at DATE,
  google_refresh_token TEXT,  -- カレンダー連携用（暗号化推奨）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. CRM顧客
-- ─────────────────────────────────────────────
CREATE TYPE customer_status AS ENUM ('prospect', 'lead', 'existing');
-- prospect=見込み(名刺交換後), lead=リード中(提案中), existing=既存顧客

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  industry TEXT,
  status customer_status NOT NULL DEFAULT 'prospect',
  relation_score INT CHECK (relation_score BETWEEN 0 AND 10),
  last_contact_at DATE,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_owner ON public.customers(owner_id);
CREATE INDEX idx_customers_status ON public.customers(status);

-- ─────────────────────────────────────────────
-- 3. 商材マスタ + 顧客との紐付け
-- ─────────────────────────────────────────────
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,  -- 'stock' (ストック) or 'shot' (ショット)
  unit_price INT,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.customer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  contracted_at DATE,
  monthly_amount INT DEFAULT 0,
  UNIQUE(customer_id, product_id)
);

-- ─────────────────────────────────────────────
-- 4. 売上レコード（月次・商材別）
-- ─────────────────────────────────────────────
CREATE TYPE revenue_type AS ENUM ('stock', 'shot');

CREATE TABLE public.sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  customer_id UUID REFERENCES public.customers(id),
  product_id UUID REFERENCES public.products(id),
  revenue_type revenue_type NOT NULL,
  amount INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  recorded_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_owner_period ON public.sales_records(owner_id, year, month);

-- ─────────────────────────────────────────────
-- 5. 自己管理シート（3種類を1テーブルで管理）
-- ─────────────────────────────────────────────
CREATE TYPE sheet_type AS ENUM ('vision', 'goal', 'development');
-- vision=理念ビジョン(オレンジ), goal=目標(青), development=育成プログラム(白)

CREATE TABLE public.personal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  sheet_type sheet_type NOT NULL,
  year INT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',  -- 柔軟な構造で保存
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sheet_type, year)
);

-- ─────────────────────────────────────────────
-- 6. PDCAシート
-- ─────────────────────────────────────────────
CREATE TABLE public.pdca_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  plan TEXT,
  do_result TEXT,
  check_result TEXT,
  action_next TEXT,
  manager_comment TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. カレンダー連携（キャッシュ用）
-- ─────────────────────────────────────────────
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  google_event_id TEXT NOT NULL,
  title TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  customer_id UUID REFERENCES public.customers(id),  -- 商談と紐付け
  event_type TEXT,  -- meeting/presentation/training/internal
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_event_id)
);

-- ─────────────────────────────────────────────
-- 8. 監査ログ（管理者操作の記録）
-- ─────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,  -- 'user.invited', 'user.suspended', 'data.exported'
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) — 権限制御の核心
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdca_records ENABLE ROW LEVEL SECURITY;

-- ヘルパー関数：現在ユーザーのロール取得
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 従業員は自分のデータのみ参照可
CREATE POLICY "members_see_own_customers" ON public.customers
  FOR SELECT USING (
    owner_id = auth.uid()
    OR auth.user_role() IN ('admin', 'manager')
  );

CREATE POLICY "members_edit_own_customers" ON public.customers
  FOR ALL USING (owner_id = auth.uid());

-- 管理者のみ従業員マスタを編集可
CREATE POLICY "admin_manage_users" ON public.users
  FOR ALL USING (auth.user_role() = 'admin');

CREATE POLICY "users_see_self" ON public.users
  FOR SELECT USING (id = auth.uid() OR auth.user_role() IN ('admin', 'manager'));

-- 売上は本人+上長+管理者のみ閲覧
CREATE POLICY "sales_visibility" ON public.sales_records
  FOR SELECT USING (
    owner_id = auth.uid()
    OR auth.user_role() = 'admin'
    OR EXISTS (SELECT 1 FROM public.users WHERE id = owner_id AND manager_id = auth.uid())
  );
