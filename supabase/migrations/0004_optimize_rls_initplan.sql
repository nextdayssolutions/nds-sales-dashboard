-- ============================================================
-- PERFORMANCE: auth.uid() を (SELECT auth.uid()) で包み、
-- RLS の init-plan 最適化を効かせる（linter: 0003_auth_rls_initplan）
-- 参考: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
-- ============================================================

-- users
DROP POLICY IF EXISTS "users_self_select" ON public.users;
CREATE POLICY "users_self_select" ON public.users
  FOR SELECT USING (
    id = (SELECT auth.uid())
    OR public.is_admin()
    OR public.is_manager_of(id)
  );

DROP POLICY IF EXISTS "users_self_update" ON public.users;
CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND role = (SELECT role FROM public.users WHERE id = (SELECT auth.uid()))
  );

-- products
DROP POLICY IF EXISTS "products_select_all" ON public.products;
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

-- customers
DROP POLICY IF EXISTS "customers_owner_modify" ON public.customers;
CREATE POLICY "customers_owner_modify" ON public.customers
  FOR ALL USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- sales_records
DROP POLICY IF EXISTS "sales_owner_modify" ON public.sales_records;
CREATE POLICY "sales_owner_modify" ON public.sales_records
  FOR ALL USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- revenue_targets
DROP POLICY IF EXISTS "targets_owner_modify" ON public.revenue_targets;
CREATE POLICY "targets_owner_modify" ON public.revenue_targets
  FOR ALL USING (owner_id = (SELECT auth.uid()))
  WITH CHECK (owner_id = (SELECT auth.uid()));

-- personal_sheets
DROP POLICY IF EXISTS "sheets_owner_write" ON public.personal_sheets;
CREATE POLICY "sheets_owner_write" ON public.personal_sheets
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- calendar_events
DROP POLICY IF EXISTS "calendar_owner_write" ON public.calendar_events;
CREATE POLICY "calendar_owner_write" ON public.calendar_events
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- audit_logs
DROP POLICY IF EXISTS "audit_authenticated_insert" ON public.audit_logs;
CREATE POLICY "audit_authenticated_insert" ON public.audit_logs
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- audit_logs の FK index（linter: 0001_unindexed_foreign_keys）
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
