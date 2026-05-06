-- Sec MED-1: customers.ig_profile_fetched 플래그 — 영구 fail customer가
-- 매 inbound마다 IG /me?fields=name,locale fetch 무한 retry 도는 것 방어.
--
-- 흐름 (webhook/instagram/route.ts):
--   guard: customer.name === null && !customer.ig_profile_fetched
--   try   → fetchUserProfile 성공 → updateCustomerProfile({name, language, igProfileFetched: true})
--   catch → updateCustomerProfile({igProfileFetched: true}) + Sentry capture
--
-- 기존 prod customer (이미 fetch 시도된 row 포함)도 false로 backfill 됨.
-- 의도: 한 번 더 retry 기회 부여 (서버 일시 오류로 fail한 케이스 회복). 그
-- 다음 fail은 영구로 마킹되어 stop.
--
-- ROLLBACK:
--   ALTER TABLE customers DROP COLUMN IF EXISTS ig_profile_fetched;

ALTER TABLE customers
  ADD COLUMN ig_profile_fetched BOOLEAN NOT NULL DEFAULT false;
