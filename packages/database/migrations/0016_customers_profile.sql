-- Epic Customer 확장 (CC-1): customers profile + 사장 메모 컬럼
--
-- 추가 컬럼:
-- - `name`         IG profile API에서 1회 fetch (process-inbound 새 customer 생성 시).
--                  IG profile은 사용자 표시명 — privacy 측면 외부 노출 X (사장 화면만).
-- - `allergy_note` 사장 메모 — 알러지·민감 등 주의사항.
-- - `preferred_designer` 사장 메모 — 선호 디자이너·스태프 이름 (free text).
--
-- 모두 TEXT NULLABLE — 기존 customer (이미 prod 존재)는 NULL로 추가됨,
-- 다음 inbound 시 자동 update 또는 사장 수동 메모. 회귀 0.
--
-- 길이 제한: application 레이어에서 zod로 강제 (name 100자, 메모 500자).
-- DB CHECK 제약 없음 — 사장 자유 입력 + 향후 메모 길이 정책 변경 유연.
--
-- ROLLBACK:
--   ALTER TABLE customers DROP COLUMN IF EXISTS name;
--   ALTER TABLE customers DROP COLUMN IF EXISTS allergy_note;
--   ALTER TABLE customers DROP COLUMN IF EXISTS preferred_designer;

ALTER TABLE customers ADD COLUMN name TEXT;
ALTER TABLE customers ADD COLUMN allergy_note TEXT;
ALTER TABLE customers ADD COLUMN preferred_designer TEXT;

-- Sec LOW 3 (사후 리뷰): defense in depth — application zod 500자, DB CHECK 2000자.
-- 직접 INSERT/backfill 스크립트가 application bypass 시 길이 제약. nullable이라
-- NULL은 통과 (memo 미입력 케이스).
ALTER TABLE customers
  ADD CONSTRAINT customers_allergy_note_len_check
  CHECK (allergy_note IS NULL OR char_length(allergy_note) <= 2000);
ALTER TABLE customers
  ADD CONSTRAINT customers_preferred_designer_len_check
  CHECK (preferred_designer IS NULL OR char_length(preferred_designer) <= 2000);
