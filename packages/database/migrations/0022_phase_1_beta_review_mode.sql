-- Phase 1-β: AI 초안 검수·승인 모드 + Bot 자동 토글
--
-- spec: docs/superpowers/specs/2026-05-07-phase-1-beta-design.md §5.2
--
-- 변경:
--   - stores.bot_mode (boolean) — false=owner 검수·승인, true=AI 자동
--   - messages.draft_status (text) — NULL/pending_review/approved/sent/skipped/direct
--   - messages.reviewed_by (uuid) — owner 처리 actor
--   - messages.edited_from_ai (boolean) — H1 수정률 분석용
--
-- RLS: 신규 정책 없음. 기존 stores/messages 정책 그대로 적용. service_role
--      bypass 유지.
--
-- ROLLBACK:
--   ALTER TABLE messages DROP CONSTRAINT messages_draft_status_check;
--   ALTER TABLE messages DROP COLUMN edited_from_ai;
--   ALTER TABLE messages DROP COLUMN reviewed_by;
--   ALTER TABLE messages DROP COLUMN draft_status;
--   ALTER TABLE stores DROP COLUMN bot_mode;

ALTER TABLE stores
  ADD COLUMN bot_mode boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN stores.bot_mode IS
  'false=owner 검수·승인, true=AI 자동 전송. Phase 1-β 학습 가설 H1 토글.';

ALTER TABLE messages
  ADD COLUMN draft_status text,
  ADD COLUMN reviewed_by uuid,
  ADD COLUMN edited_from_ai boolean;

ALTER TABLE messages
  ADD CONSTRAINT messages_draft_status_check
  CHECK (draft_status IS NULL
    OR draft_status IN ('pending_review','approved','sent','skipped','direct'));

COMMENT ON COLUMN messages.draft_status IS
  'NULL=수신 메시지. pending_review=AI 초안 대기. approved/sent/skipped=owner 처리. direct=owner 직접 작성(Phase 1-β 후 합류).';
COMMENT ON COLUMN messages.reviewed_by IS
  'Owner / admin user who processed the AI draft (FK to better-auth users.id, no enforced constraint to keep RLS-flexible).';
COMMENT ON COLUMN messages.edited_from_ai IS
  'AI 초안과 최종 전송 텍스트가 다른지. H1 수정률 분석용.';
