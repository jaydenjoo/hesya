-- Phase 1-γ.1.5 (E12-9): 매장 해지·데이터 삭제 (개인정보보호법 30일 grace).
--
-- spec: docs/PRD.md § Epic 12.9 (line 1068, 1082)
-- plan: docs/Plan-v2-scenario-B.md γ.1.5
--
-- 변경:
--   - stores.deleted_at, stores.deletion_reason (신규 컬럼, soft-delete)
--   - stores.deleted_at 부분 인덱스 (cron 스캔 + admin 큐)
--   - store_deletion_requests (신규 테이블) — 해지 요청 이력 + grace SLA
--   - 부분 unique 인덱스: 매장당 활성 요청 1개만 (cancelled_at IS NULL AND purged_at IS NULL)
--   - scheduled_purge_at 부분 인덱스 (cron 스캔)
--
-- RLS: service_role bypass 유지 (0022~0024 패턴 일치). 정책은 향후
--      anon/authenticated 사용 시점의 차단선으로 별도 마이그.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS store_deletion_requests CASCADE;
--   DROP INDEX IF EXISTS stores_deleted_at_idx;
--   ALTER TABLE stores DROP COLUMN IF EXISTS deleted_at;
--   ALTER TABLE stores DROP COLUMN IF EXISTS deletion_reason;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS deletion_reason text;

CREATE INDEX IF NOT EXISTS stores_deleted_at_idx
  ON stores (deleted_at)
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN stores.deleted_at IS
  'Soft-delete 시각. NOT NULL이면 grace 진행 중. 30일 후 cron이 cascade hard-delete.';
COMMENT ON COLUMN stores.deletion_reason IS
  '해지 사유 (owner 자가해지 입력 or admin 강제해지 메모).';

CREATE TABLE IF NOT EXISTS store_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ON DELETE SET NULL — purge 완료 후 stores cascade로 사라져도 request row는
  -- 보존 (admin 'purged' 큐 + audit). store_name_snapshot이 사람이 읽는 라벨 보존.
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  store_name_snapshot text NOT NULL,
  source text NOT NULL CHECK (source IN ('owner', 'admin')),
  requested_by_email text NOT NULL,
  requested_by_user_id uuid,
  reason text,
  scheduled_purge_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  cancelled_by_email text,
  purged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 활성 요청 1개 보장 (store_id가 SET NULL 처리될 수 있어 NULL 행 다수 허용 —
-- purge 완료 후의 historical row는 store_id NULL이므로 unique 충돌 없음).
CREATE UNIQUE INDEX IF NOT EXISTS store_deletion_requests_active_unique
  ON store_deletion_requests (store_id)
  WHERE store_id IS NOT NULL AND cancelled_at IS NULL AND purged_at IS NULL;

CREATE INDEX IF NOT EXISTS store_deletion_requests_purge_due_idx
  ON store_deletion_requests (scheduled_purge_at)
  WHERE store_id IS NOT NULL AND cancelled_at IS NULL AND purged_at IS NULL;

CREATE INDEX IF NOT EXISTS store_deletion_requests_store_idx
  ON store_deletion_requests (store_id);

COMMENT ON TABLE store_deletion_requests IS
  '매장 해지 요청 이력 — Epic 12.9 (PRD §1068, SLA 30일 grace, PIPA §21).';
COMMENT ON COLUMN store_deletion_requests.store_id IS
  'stores.id FK ON DELETE SET NULL — purge 완료 후 NULL이 됨. store_name_snapshot으로 이력 보존.';
COMMENT ON COLUMN store_deletion_requests.store_name_snapshot IS
  '요청 시점 stores.name 스냅샷 — purge 후 admin 큐에서 사람이 읽는 라벨로 사용.';
COMMENT ON COLUMN store_deletion_requests.source IS
  'owner=자가해지, admin=강제해지(약관 위반 등).';
COMMENT ON COLUMN store_deletion_requests.scheduled_purge_at IS
  'created_at + 30일 (STORE_DELETION_GRACE_DAYS). cron이 이 시각 이후 row를 cascade purge.';
COMMENT ON COLUMN store_deletion_requests.requested_by_user_id IS
  'Better Auth users.id (FK 없음, 0022~0024 RLS-flexible 패턴).';
