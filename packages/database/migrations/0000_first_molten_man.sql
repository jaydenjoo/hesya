CREATE TABLE "aftercare_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"send_at" timestamp with time zone,
	"status" text,
	"template" text,
	"content" text
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"customer_id" uuid,
	"staff_id" uuid,
	"service_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" text,
	"total_price_krw" integer,
	"deposit_paid_krw" integer,
	"payment_method" text,
	"notes_multilang" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text,
	"channel" text,
	"nationality" text,
	"preferred_language" text,
	"payment_method_preferred" text,
	"total_visits" integer DEFAULT 0,
	"ltv_krw" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"customer_id" uuid,
	"channel" text,
	"direction" text,
	"original_text" text,
	"translated_text" text,
	"language_from" text,
	"language_to" text,
	"ai_responded" boolean DEFAULT false,
	"ai_model" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "messages_direction_check" CHECK ("messages"."direction" IN ('inbound','outbound'))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"amount_krw" integer,
	"amount_foreign" numeric,
	"currency_foreign" text,
	"exchange_rate" numeric,
	"provider" text,
	"provider_transaction_id" text,
	"status" text,
	"fee_saas_krw" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"source" text,
	"source_review_id" text,
	"rating" integer,
	"content" text,
	"language" text,
	"sentiment" text,
	"fetched_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"name_ko" text NOT NULL,
	"name_en" text,
	"name_ja" text,
	"name_zh_cn" text,
	"name_zh_tw" text,
	"name_vi" text,
	"price_krw" integer NOT NULL,
	"duration_minutes" integer,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"name" text NOT NULL,
	"languages" text[] DEFAULT '{"ko"}',
	"portfolio_urls" text[],
	"non_asian_works" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "store_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"reporter_type" text,
	"report_reason" text,
	"description" text,
	"evidence_urls" text[],
	"status" text DEFAULT 'pending',
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"business_number" text NOT NULL,
	"representative_name" text NOT NULL,
	"start_date" date,
	"nts_validation_result" text,
	"nts_status" text,
	"nts_tax_type" text,
	"localdata_matched" boolean DEFAULT false,
	"localdata_business_type" text,
	"localdata_status" text,
	"category_classified" text,
	"category_confidence" numeric,
	"self_declaration_signed_at" timestamp with time zone,
	"declaration_no_massage" boolean,
	"declaration_no_medical_device" boolean,
	"declaration_no_oriental_medicine" boolean,
	"ocr_extracted_data" jsonb,
	"ocr_match_score" numeric,
	"keyword_scan_passed" boolean,
	"flagged_keywords" text[],
	"verification_status" text,
	"rejection_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"last_revalidation_at" timestamp with time zone,
	"next_revalidation_due" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"region" text,
	"address" jsonb,
	"phone" text,
	"business_license_number" text,
	"business_license_image_url" text,
	"tax_refund_registered" boolean DEFAULT false,
	"verification_status" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "stores_category_check" CHECK ("stores"."category" IN ('hair_general','skin_beauty','nail','makeup','composite','free_personal_color','free_makeup_class','free_hanbok','free_kpop_class')),
	CONSTRAINT "stores_verification_status_check" CHECK ("stores"."verification_status" IN ('pending','auto_approved','manual_review','rejected'))
);
--> statement-breakpoint
ALTER TABLE "aftercare_messages" ADD CONSTRAINT "aftercare_messages_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_reports" ADD CONSTRAINT "store_reports_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_verifications" ADD CONSTRAINT "store_verifications_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;