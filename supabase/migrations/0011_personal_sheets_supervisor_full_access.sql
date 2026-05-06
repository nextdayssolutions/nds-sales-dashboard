-- ─────────────────────────────────────────────
-- 0011: personal_sheets の supervisor RLS を INSERT/UPDATE/DELETE すべてに拡張
--
-- 既存の "sheets_supervisor_update" は UPDATE のみだったため、
-- 対象ユーザーがまだそのシート種別を保存していない場合 (= 行が存在しない場合)、
-- admin/manager の upsert が INSERT パスに入って "sheets_owner_write" の WITH CHECK
-- (user_id = auth.uid()) で拒否されていた。
--
-- 例:
--   * 本人がまだ日報を 1 件も書いていない → admin がマネージャーコメントを追加して保存 → 失敗
--   * 本人がまだ育成計画を保存していない → admin が trainer 列にチェック → 失敗
--
-- customers / sales_records / revenue_targets と同様に、
-- supervisor (admin / マネージャー) が任意の CRUD を行えるよう FOR ALL に統一する。
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "sheets_supervisor_update" ON public.personal_sheets;

CREATE POLICY "sheets_supervisor_modify" ON public.personal_sheets
  FOR ALL
  USING (is_admin() OR is_manager_of(user_id))
  WITH CHECK (is_admin() OR is_manager_of(user_id));
