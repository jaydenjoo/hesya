-- Sec-M-3: 16 테이블 RLS POLICY 일괄 추가 (advisor `rls_enabled_no_policy` INFO fix)
--
-- 모든 테이블이 0001/0003에서 ENABLE ROW LEVEL SECURITY 됐으나 POLICY가
-- 정의되지 않은 상태. 현재 application은 service_role direct connection이라
-- 모든 정책 bypass → 회귀 0. 향후 anon/authenticated 키 노출 시 본 정책이
-- 차단선이자 의도 명세.
--
-- 0017 InitPlan 패턴 재사용: `(select auth.uid())` — planner가 InitPlan으로
-- 1회 평가 (hot path 성능).
--
-- 분류:
--   1) owner-scoped via store_owners join: stores/services/staff/bookings/
--      reviews/store_verifications/store_reports
--   2) indirect (FK chain): payments→bookings, aftercare_messages→bookings,
--      kyc_verification_logs→store_verifications, customers→conversations
--   3) user-scoped: users/sessions/store_owners
--   4) service-role only (USING false): accounts/verifications (better-auth
--      OAuth 토큰 + email verify는 서버만 접근, anon 절대 노출 X)
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS <policy_name> ON <table>;  (16개 일괄)

-- ─── 1) owner-scoped (store_id 직접) ───

-- stores: 본인이 owner인 매장만 (자체 id가 store_owners.store_id에 매칭)
CREATE POLICY stores_owner ON stores
  FOR ALL
  USING (id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())))
  WITH CHECK (id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())));

CREATE POLICY services_store_owner ON services
  FOR ALL
  USING (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())))
  WITH CHECK (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())));

CREATE POLICY staff_store_owner ON staff
  FOR ALL
  USING (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())))
  WITH CHECK (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())));

CREATE POLICY bookings_store_owner ON bookings
  FOR ALL
  USING (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())))
  WITH CHECK (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())));

CREATE POLICY reviews_store_owner ON reviews
  FOR ALL
  USING (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())))
  WITH CHECK (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())));

CREATE POLICY store_verifications_store_owner ON store_verifications
  FOR ALL
  USING (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())))
  WITH CHECK (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())));

CREATE POLICY store_reports_store_owner ON store_reports
  FOR ALL
  USING (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())))
  WITH CHECK (store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid())));

-- ─── 2) indirect (FK chain) ───

-- payments: booking_id → bookings.store_id
CREATE POLICY payments_store_owner ON payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = payments.booking_id
        AND b.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = payments.booking_id
        AND b.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  );

-- aftercare_messages: booking_id → bookings.store_id
CREATE POLICY aftercare_messages_store_owner ON aftercare_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = aftercare_messages.booking_id
        AND b.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = aftercare_messages.booking_id
        AND b.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  );

-- kyc_verification_logs: verification_id → store_verifications.store_id
CREATE POLICY kyc_verification_logs_store_owner ON kyc_verification_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM store_verifications sv
      WHERE sv.id = kyc_verification_logs.verification_id
        AND sv.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_verifications sv
      WHERE sv.id = kyc_verification_logs.verification_id
        AND sv.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  );

-- customers: 본인 매장과 conversation으로 연결된 customer만
-- (한 customer가 여러 store와 messaging 가능 — 다대다)
CREATE POLICY customers_via_conversations ON customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.customer_id = customers.id
        AND c.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.customer_id = customers.id
        AND c.store_id IN (SELECT store_id FROM store_owners WHERE user_id = (select auth.uid()))
    )
  );

-- ─── 3) user-scoped ───

-- users: 본인만 (id = auth.uid())
CREATE POLICY users_self ON users
  FOR ALL
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- sessions: 본인 session만 (logout/list 등 self-service)
CREATE POLICY sessions_self ON sessions
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- store_owners: 본인 owner 정보만 (어떤 매장 owner인지 self lookup)
CREATE POLICY store_owners_self ON store_owners
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ─── 4) service-role only (better-auth 내부 — anon 절대 노출 X) ───

-- accounts: better-auth OAuth 토큰 (refresh_token 등) 저장. anon에게
-- self 노출도 위험 — 토큰 탈취 표면 확장. service-role만 접근.
CREATE POLICY accounts_service_only ON accounts
  FOR ALL
  USING (false);

-- verifications: better-auth email verification 토큰 (단명 비밀). anon
-- 노출 시 enumeration 가능. service-role만 접근.
CREATE POLICY verifications_service_only ON verifications
  FOR ALL
  USING (false);
