-- ===========================================================================
-- 0012_fix_users_self_update_recursion.sql
-- ---------------------------------------------------------------------------
-- 症状:
--   admin が /admin の編集モードで保存を押すと
--   "infinite recursion detected in policy for relation \"users\"" が発生する。
--
-- 原因:
--   users_self_update の WITH CHECK 句が
--     role = (SELECT role FROM public.users WHERE id = auth.uid())
--   と書かれており、UPDATE 評価中に users への SELECT が走る。
--   その SELECT が users_self_select policy を再評価し、policy 評価が
--   relation 'users' に対して再帰しているため PostgreSQL が再帰検出して
--   エラーを投げる。
--
-- 修正:
--   サブクエリを SECURITY DEFINER 関数 public.current_user_role() に置換。
--   関数の owner (postgres) は BYPASSRLS を持つため、関数内 SELECT は
--   RLS を bypass し、policy が再帰しない。
--
--   なお、本人による role 変更禁止のセマンティクスは維持される
--   （admin による他者の role 変更は users_admin_all 経由で許可）。
-- ===========================================================================

DROP POLICY IF EXISTS "users_self_update" ON public.users;

CREATE POLICY "users_self_update" ON public.users
  FOR UPDATE
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND role = public.current_user_role()
  );
