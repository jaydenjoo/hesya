-- Plan v3 M3.3 — 매장 영업시간 컬럼 도입.
--
-- 변경 의도: M2.3 customer schedule UI의 hard-code 10:00~20:00을 매장별 dynamic으로 교체.
--           영업시간 외 슬롯이 차단되어 예약 정확도 향상.
--
-- 변경:
--   - stores.business_hours jsonb (nullable, default NULL)
--
-- 형식:
--   {
--     "mon": {"open": "10:00", "close": "20:00"},
--     "tue": {"open": "10:00", "close": "20:00"},
--     "wed": {"open": "10:00", "close": "20:00"},
--     "thu": {"open": "10:00", "close": "20:00"},
--     "fri": {"open": "10:00", "close": "20:00"},
--     "sat": {"open": "10:00", "close": "18:00"},
--     "sun": null   <- 휴무
--   }
--
-- NULL = "매장 영업시간 미설정 — 기본값 10:00~20:00 사용". M2.3 time-slots
-- util은 null fallback 처리.
--
-- 영향: stores 테이블 alter only. 기존 row는 NULL로 채워짐. M3.3b에서
-- M2.3 schedule UI가 이 컬럼을 읽어 dynamic 슬롯 생성.
--
-- RLS: service_role bypass (기존 stores 정책 동일).
--
-- ROLLBACK:
--   ALTER TABLE stores DROP COLUMN IF EXISTS business_hours;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS business_hours jsonb;

COMMENT ON COLUMN stores.business_hours IS
  'Plan v3 M3.3 — 요일별 영업시간 { mon~sun: {open, close} | null }. NULL = 기본값 10:00~20:00 사용 (M2.3 fallback).';
