-- Plan v3 M3.x — booking race condition 영구 차단 (Task 7 후속).
--
-- 변경 의도: customer-actions.ts의 read-check + insert 사이 race window 영구 차단.
--           DB 레벨 unique constraint로 동시 insert 중 한 건만 성공 보장.
--
-- 인덱스 정의: bookings (staff_id, scheduled_at) WHERE status != 'cancelled'
--   - cancelled 제외 → 취소된 동시간 슬롯은 다른 손님이 재예약 가능 (정상 흐름)
--   - 같은 staff에 같은 정각 시각 active booking 1개만 허용
--
-- 변경:
--   - CREATE UNIQUE INDEX bookings_unique_active_staff_time
--
-- 영향:
--   - bookings 테이블 (인덱스 추가)
--   - 기존 데이터 사전 검증: 시드/베타 환경은 conflict 없음 (resetDb로 매번 reset).
--     prod에 active conflict row가 존재할 가능성은 낮으나 apply 전 확인 권장:
--       SELECT staff_id, scheduled_at, COUNT(*)
--       FROM bookings WHERE status != 'cancelled'
--       GROUP BY 1, 2 HAVING COUNT(*) > 1;
--
-- application 영향:
--   - customer-actions.ts: PG 23505 (unique_violation) catch → slot_taken 반환
--   - 기존 BookingSlotTakenError sentinel은 read-check 단계용으로 유지 (메시지 일관성)
--
-- RLS: service_role bypass (기존 bookings 정책 동일).
--
-- ROLLBACK:
--   DROP INDEX IF EXISTS bookings_unique_active_staff_time;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_active_staff_time
  ON bookings (staff_id, scheduled_at)
  WHERE status != 'cancelled';

COMMENT ON INDEX bookings_unique_active_staff_time IS
  'Plan v3 M3.x — 같은 staff/시각에 active(=non-cancelled) booking 1개만. customer-actions race 차단.';
