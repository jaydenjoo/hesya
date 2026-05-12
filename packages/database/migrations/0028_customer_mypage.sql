-- Plan v3 M3.4 (full scope) — customer-side MyPage 기반.
--
-- 변경 의도: 외국인 손님 mypage 도입 (Upcoming/Past/Saved/Reviews 탭).
--           magic link 인증 → bookings.customerId 채움 → 본인 예약 조회.
--
-- 변경:
--   1) customers.email (nullable + unique partial index — IG 채널 손님은 email 없을 수 있음)
--   2) customers.last_seen_at (nullable timestamptz — mypage 접속 시각)
--   3) customer_saved_stores 테이블 (composite PK + FK)
--   4) reviews.customer_id + reviews.booking_id (nullable FK — phase ζ 외부 fetch와 호환)
--
-- 영향:
--   - customers 테이블 alter
--   - reviews 테이블 alter
--   - customer_saved_stores 테이블 신규
--   - 기존 row 영향 X (모두 nullable 추가)
--
-- application 영향:
--   - customer-actions: email 입력 → upsertCustomerByEmail → bookings.customerId 채움
--   - /c/mypage: customer auth session → email로 customer 식별 → 예약/찜/리뷰 조회
--   - reviews.source = 'customer' 값으로 손님 직접 작성 분기 (기존 외부 'naver'/'google'과 공존)
--
-- RLS: service_role bypass (기존 정책 동일).
--
-- ROLLBACK:
--   ALTER TABLE reviews DROP COLUMN IF EXISTS customer_id;
--   ALTER TABLE reviews DROP COLUMN IF EXISTS booking_id;
--   DROP TABLE IF EXISTS customer_saved_stores;
--   DROP INDEX IF EXISTS idx_customers_email_unique;
--   ALTER TABLE customers DROP COLUMN IF EXISTS last_seen_at;
--   ALTER TABLE customers DROP COLUMN IF EXISTS email;

-- 1) customers.email + last_seen_at
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_unique
  ON customers (lower(email))
  WHERE email IS NOT NULL;

COMMENT ON COLUMN customers.email IS
  'M3.4 — customer 식별자. nullable (IG 채널은 external_id로 식별). lower(email) unique 부분 인덱스.';
COMMENT ON COLUMN customers.last_seen_at IS
  'M3.4 — mypage 접속 시각. 마지막 활성 추적용.';

-- 2) customer_saved_stores
CREATE TABLE IF NOT EXISTS customer_saved_stores (
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  store_id    uuid NOT NULL REFERENCES stores(id)    ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_saved_stores_customer
  ON customer_saved_stores (customer_id);

COMMENT ON TABLE customer_saved_stores IS
  'M3.4 — 손님 찜한 매장 (mypage Saved 탭).';

-- 3) reviews.customer_id + booking_id
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_id  uuid REFERENCES bookings(id)  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_customer
  ON reviews (customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_booking
  ON reviews (booking_id)
  WHERE booking_id IS NOT NULL;

COMMENT ON COLUMN reviews.customer_id IS
  'M3.4 — 손님 직접 작성 리뷰 식별. source=''customer'' 분기와 함께 사용. 기존 외부 fetch row는 NULL 유지.';
COMMENT ON COLUMN reviews.booking_id IS
  'M3.4 — 어떤 booking에 대한 리뷰인지. 손님 작성 리뷰만 채움. 기존 외부 fetch row는 NULL.';
