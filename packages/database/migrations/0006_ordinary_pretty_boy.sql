CREATE TABLE "kyc_verification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kyc_verification_logs_event_type_check" CHECK ("kyc_verification_logs"."event_type" IN ('nts_check','localdata_match','status_change','cron_revalidate','notification_sent'))
);
--> statement-breakpoint
ALTER TABLE "kyc_verification_logs" ADD CONSTRAINT "kyc_verification_logs_verification_id_store_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."store_verifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verification_logs" ADD CONSTRAINT "kyc_verification_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kyc_verification_logs_verification_id_idx" ON "kyc_verification_logs" USING btree ("verification_id");--> statement-breakpoint
CREATE INDEX "kyc_verification_logs_event_type_idx" ON "kyc_verification_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "kyc_verification_logs_created_at_idx" ON "kyc_verification_logs" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
-- RLS + IMMUTABLE trigger (drizzle-kit는 RLS·trigger 무지 — 수동 추가, RLS v0001과 동일 패턴)
ALTER TABLE "kyc_verification_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- service_role: rolsuper=false, rolbypassrls=true → RLS deny 정책 우회 가능 + REVOKE는 GRANT
-- 자동 복구 가능. trigger는 superuser 외 모든 role 차단 (임시 테이블 검증 완료).
CREATE OR REPLACE FUNCTION prevent_kyc_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'kyc_verification_logs is immutable — UPDATE/DELETE not allowed (E9-12 audit log)';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER kyc_logs_immutable_no_update
  BEFORE UPDATE ON kyc_verification_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_kyc_log_modification();--> statement-breakpoint
CREATE TRIGGER kyc_logs_immutable_no_delete
  BEFORE DELETE ON kyc_verification_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_kyc_log_modification();
