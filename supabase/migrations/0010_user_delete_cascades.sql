-- ─────────────────────────────────────────────
-- 0010: ユーザー削除時の FK カスケード方針を整える
--
-- これまで NO ACTION だった外部キーを以下に変更:
--
-- CASCADE — 削除する従業員固有のデータは一緒に消す
--   * customers.owner_id     (顧客は担当者の所有物)
--   * sales_records.owner_id (売上は担当者の実績)
--   ※ personal_sheets, revenue_targets, calendar_events は既に CASCADE 済
--
-- SET NULL — 履歴・組織構造は残す
--   * audit_logs.actor_id    (監査ログは actor 削除後も保持、誰がやったかだけ NULL に)
--   * users.manager_id       (上司削除時、配下は孤児にせずマネージャー未設定にする)
-- ─────────────────────────────────────────────

ALTER TABLE public.customers
  DROP CONSTRAINT customers_owner_id_fkey,
  ADD CONSTRAINT customers_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.sales_records
  DROP CONSTRAINT sales_records_owner_id_fkey,
  ADD CONSTRAINT sales_records_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.audit_logs
  DROP CONSTRAINT audit_logs_actor_id_fkey,
  ADD CONSTRAINT audit_logs_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.users
  DROP CONSTRAINT users_manager_id_fkey,
  ADD CONSTRAINT users_manager_id_fkey
    FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;
