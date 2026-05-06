-- Code LOW-7: customers.preferred_designer DB CHECK 2000 → 100자 통일
--
-- 0016에서 사장 메모 자유 입력 위해 보수적 2000자 CHECK 적용했으나,
-- preferred_designer는 이름 필드 (단일 사람 이름) — Zod max(500), UI
-- maxLength=500과도 불일치. 이번 마이그로 3-layer (Zod 100 / DB CHECK 100 /
-- UI maxLength 100) 통일.
--
-- allergy_note는 메모 자유 입력이라 500자 유지 (Zod) / 2000자 유지 (DB).
--
-- ROLLBACK:
--   ALTER TABLE customers DROP CONSTRAINT customers_preferred_designer_len_check;
--   ALTER TABLE customers
--     ADD CONSTRAINT customers_preferred_designer_len_check
--     CHECK (preferred_designer IS NULL OR char_length(preferred_designer) <= 2000);

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_preferred_designer_len_check;
ALTER TABLE customers
  ADD CONSTRAINT customers_preferred_designer_len_check
  CHECK (preferred_designer IS NULL OR char_length(preferred_designer) <= 100);
