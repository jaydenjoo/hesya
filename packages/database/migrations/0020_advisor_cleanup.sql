-- advisor cleanup: function_search_path WARN 1 + unindexed_foreign_keys 16 INFO
--
-- 1) function_search_path_mutable: prevent_kyc_log_modification 함수가
--    search_path 미설정 → 함수 실행 시점의 role search_path를 사용 (search-path
--    hijack 위험). 빈 search_path 명시로 모든 ref를 fully-qualified로 강제.
--
-- 2) unindexed_foreign_keys: PostgreSQL은 PK는 자동 인덱스 생성하나 FK는 X.
--    16 FK 중 hot path(conversations.customer_id, messages.customer_id/store_id,
--    store_owners.store_id) 외 미구현 기능 테이블도 일괄 추가 — 데이터 0
--    시점이라 storage 비용 거의 0 + future advisor 16 INFO → 0건 정리.
--
-- 데이터 0 시점이라 단순 CREATE INDEX 사용 (CONCURRENTLY 불필요). 베타/prod
-- 트래픽 시점에 추가 인덱스 작업이 있으면 그땐 CONCURRENTLY로.
--
-- ROLLBACK:
--   ALTER FUNCTION public.prevent_kyc_log_modification() RESET search_path;
--   DROP INDEX IF EXISTS idx_aftercare_messages_booking_id;
--   ... (16개 일괄)

-- 1) function search_path fix
ALTER FUNCTION public.prevent_kyc_log_modification() SET search_path = '';

-- 2) FK covering index 16개
CREATE INDEX IF NOT EXISTS idx_aftercare_messages_booking_id
  ON aftercare_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id
  ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id
  ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_id
  ON bookings(staff_id);
CREATE INDEX IF NOT EXISTS idx_bookings_store_id
  ON bookings(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id
  ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verification_logs_actor_user_id
  ON kyc_verification_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_customer_id
  ON messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_messages_store_id
  ON messages(store_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id
  ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id
  ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_services_store_id
  ON services(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_store_id
  ON staff(store_id);
CREATE INDEX IF NOT EXISTS idx_store_owners_store_id
  ON store_owners(store_id);
CREATE INDEX IF NOT EXISTS idx_store_reports_store_id
  ON store_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_store_verifications_store_id
  ON store_verifications(store_id);
