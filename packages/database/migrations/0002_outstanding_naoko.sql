CREATE TABLE "store_owners" (
	"user_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_owners_user_id_store_id_pk" PRIMARY KEY("user_id","store_id"),
	CONSTRAINT "store_owners_role_check" CHECK ("store_owners"."role" IN ('owner','manager'))
);
--> statement-breakpoint
ALTER TABLE "store_owners" ADD CONSTRAINT "store_owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_owners" ADD CONSTRAINT "store_owners_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;