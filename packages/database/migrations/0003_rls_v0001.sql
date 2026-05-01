-- S-5 RLS v0001: enable Row Level Security on all 16 tables (default deny)
--
-- Strategy: anon/authenticated → blocked, service_role (BYPASSRLS) → allowed.
-- Phase 1 access pattern: SSR + Server Action only (no client supabase-js).
-- Future v0002+: Better Auth ↔ Supabase JWT bridge + per-role policies.

-- Auth domain (Better Auth)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verifications" ENABLE ROW LEVEL SECURITY;

-- Multi-tenancy mapping (S-19)
ALTER TABLE "store_owners" ENABLE ROW LEVEL SECURITY;

-- Business domain (PRD § 7)
ALTER TABLE "stores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "store_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "aftercare_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "store_reports" ENABLE ROW LEVEL SECURITY;
