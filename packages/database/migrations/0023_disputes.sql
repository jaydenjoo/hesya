-- Phase 1-γ.1 (E12-4): 분쟁 처리 큐 (노쇼·환불·컴플레인, SLA 5영업일)
--
-- spec: docs/PRD.md § Epic 12.4 (line 1063, 1077)
--
-- 변경:
--   - disputes (신규 테이블)
--   - 인덱스 3종 (store_id, status, sla_due_at)
--
-- RLS: service_role bypass 유지. 정책은 향후 anon/authenticated 사용 시점의
--      차단선으로 별도 마이그에서 추가 (현재 application layer 검증 — 0022 패턴).
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS disputes CASCADE;

CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  filed_by_user_id uuid,
  category text NOT NULL CHECK (category IN ('no_show','refund','complaint')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_review','resolved','rejected','sla_exceeded')),
  resolution text,
  resolved_by_user_id uuid,
  sla_due_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS disputes_store_idx ON disputes(store_id);
CREATE INDEX IF NOT EXISTS disputes_status_idx ON disputes(status);
CREATE INDEX IF NOT EXISTS disputes_sla_due_idx ON disputes(sla_due_at);

COMMENT ON TABLE disputes IS
  '분쟁 처리 큐 — Epic 12.4 (PRD §1063, SLA 5영업일).';
COMMENT ON COLUMN disputes.category IS
  'no_show=노쇼, refund=환불 요청, complaint=일반 컴플레인.';
COMMENT ON COLUMN disputes.status IS
  'open=신고 접수, in_review=admin 검토 중, resolved=해결, rejected=거절, sla_exceeded=SLA 초과.';
COMMENT ON COLUMN disputes.filed_by_user_id IS
  'Better Auth users.id (신고한 사장). FK 없음 (RLS-flexible, 0022 패턴).';
COMMENT ON COLUMN disputes.resolved_by_user_id IS
  'Better Auth users.id (처리한 admin). FK 없음.';
COMMENT ON COLUMN disputes.sla_due_at IS
  '생성 시 계산: created_at + 5영업일 (월~금, 공휴일 무시 — 베타 MVP).';
