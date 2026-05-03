-- v0005 (P1-5): store_verifications.verification_status 신뢰성 보강.
-- 0000은 nullable + CHECK 없음 → KYC 진행 row를 NULL로 두면 어디까지 갔는지
-- 식별 불가. PRD § 7 + stores 테이블과 동일 4-enum CHECK 적용.
-- cron route는 직전 commit에서 'approved' → 'auto_approved'로 사전 정정됨.
UPDATE "store_verifications" SET "verification_status" = 'pending' WHERE "verification_status" IS NULL;--> statement-breakpoint
ALTER TABLE "store_verifications" ALTER COLUMN "verification_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "store_verifications" ALTER COLUMN "verification_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "store_verifications" ADD CONSTRAINT "store_verifications_verification_status_check" CHECK ("store_verifications"."verification_status" IN ('pending','auto_approved','manual_review','rejected'));
