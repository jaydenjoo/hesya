-- Phase 1-γ.1.4 (E12-8): API 정책 변경 알림 (n8n RSS → hesya webhook → admin 큐)
--
-- spec: docs/PRD.md § Epic 12.8 (line 1063), R1 (인스타·왓츠앱 API 정책 변경)
-- plan: docs/Plan-v2-scenario-B.md γ.1.4
--
-- 변경:
--   - api_policy_alerts (신규 테이블)
--   - UNIQUE(source, guid) — n8n 측 중복 발송 차단 (베스트 에포트)
--   - INDEX (status, received_at desc) — admin 큐 정렬 + 필터
--
-- RLS: service_role bypass 유지. 정책은 향후 anon/authenticated 사용 시점의
--      차단선으로 별도 마이그 (현재 application layer 검증 — 0023 패턴 일치).
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS api_policy_alerts CASCADE;

CREATE TABLE IF NOT EXISTS api_policy_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  title text NOT NULL,
  link text NOT NULL,
  guid text NOT NULL,
  pub_date timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'resolved', 'ignored')),
  notes text,
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  CONSTRAINT api_policy_alerts_source_guid_unique UNIQUE (source, guid)
);

CREATE INDEX IF NOT EXISTS api_policy_alerts_status_received_idx
  ON api_policy_alerts (status, received_at DESC);

CREATE INDEX IF NOT EXISTS api_policy_alerts_source_idx
  ON api_policy_alerts (source);
