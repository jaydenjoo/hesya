-- Epic 12-α foundational — users.role 컬럼 도입.
--
-- 변경 의도: 기존 `ADMIN_EMAILS` env 화이트리스트(첫 운영자 1~2명용 임시
--          솔루션)를 DB single source of truth로 이전. 이 마이그는 컬럼만
--          추가하며, 22개의 `requireAdminEmail` 호출처는 별도 PR에서 점진
--          마이그(Phase 1-γ.2+).
--
-- Enum: 'user' (default) | 'admin'. super_admin·moderator 등은 YAGNI (4원칙 2번).
--
-- 영향:
--   - users 테이블에 컬럼 1개 + CHECK 제약 1개 추가
--   - 기존 row 모두 default 'user' 로 backfill
--   - ADMIN_EMAILS env에 등록된 이메일은 별도 UPDATE 문으로 'admin' 승격
--     ⚠️ Apply 시 Jayden이 ADMIN_EMAILS 현재 값 기준으로 UPDATE 1줄 추가
--        실행 (아래 ⚠️ 블록 참조)
--
-- application 영향:
--   - schema/auth/users.ts 갱신 (drizzle 빌드 영향만, 기존 코드 회귀 0)
--   - 신규 admin-role-guard.ts + dal/users.ts 동반 (PR 동일)
--   - 기존 requireAdminEmail 호출처는 유지 — 별도 PR 점진 마이그
--
-- service_role bypass: yes (모든 application 코드는 service_role connection 사용).
--                       RLS 정책은 본 컬럼에 추가하지 않음 — 향후 anon/authenticated
--                       키 도입 시 별도 작성.
--
-- ROLLBACK:
--   ALTER TABLE users DROP CONSTRAINT users_role_check;
--   ALTER TABLE users DROP COLUMN role;

ALTER TABLE users
  ADD COLUMN role text NOT NULL DEFAULT 'user';

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('user','admin'));

-- ⚠️ Apply 후 Jayden이 ADMIN_EMAILS 현재 값으로 아래 1줄 실행 (예시):
--   UPDATE users SET role = 'admin' WHERE email IN ('admin1@example.com','admin2@example.com');
-- ADMIN_EMAILS는 env에 있으므로 SQL에 하드코딩하지 않음.
