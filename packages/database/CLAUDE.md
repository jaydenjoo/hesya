# packages/database — DB & Migrations

> ⚠️ **이 폴더는 hybrid 마이그 상태**. 함정이 큽니다. 새 테이블/컬럼 추가 전 이 문서를 끝까지 읽으세요.

## ⚠️ Hybrid 마이그 상태 (CRITICAL)

| 범위             | 작성 방식                                               | drizzle 추적 |
| ---------------- | ------------------------------------------------------- | ------------ |
| `0000` ~ `0010`  | drizzle-kit generate 자동                               | ✅           |
| `0011` ~ `0021+` | **Manual SQL** (RLS, indexes, advisor cleanup, 컬럼 등) | ❌           |

**증거**: `migrations/meta/_journal.json`은 `0011_inbox_conversations`까지만 있고, snapshot 파일도 `0010_snapshot.json`까지만 존재. drizzle은 0011 시점부터 schema 추적 중단.

## ❌ 절대 금지 (사고 사례 — 2026-05-07 L-078)

```bash
# ❌ NO!  hybrid 상태에서 db:generate 실행
pnpm --filter @hesya/database db:generate
```

이 명령은 **이미 manual로 추가된 conversations, store_integrations, store_knowledge, store_tone_examples + customers/messages 컬럼**을 다시 만들려고 SQL을 생성합니다. apply 시 충돌 또는 데이터 손실.

### 실수로 실행했다면 즉시 복구

```bash
rm packages/database/migrations/<생성된번호>_<랜덤어>.sql
rm packages/database/migrations/meta/<같은번호>_snapshot.json
git checkout packages/database/migrations/meta/_journal.json
```

## ✅ 새 테이블/컬럼 추가 절차

1. **Drizzle schema TS 작성/수정** (`src/schema/`)
   - 기존 패턴 reference: `store-owners.ts` (composite PK + check constraint)
   - `index.ts`에 export 추가
   - **이 단계는 안전 — drizzle journal과 무관**

2. **Manual SQL 마이그 작성** (`migrations/<NNNN>_<설명>.sql`)
   - 번호: 마지막 manual 번호 + 1 (현재 다음 = 0022)
   - **ROLLBACK SQL 주석 의무** (0017, 0019, 0021 패턴 참조)
   - 다음 항목 명시:
     - 변경 의도 (한 줄)
     - 영향 받는 테이블/컬럼
     - service_role bypass 여부 (RLS 정책 추가 시)
     - ROLLBACK SQL

3. **Apply** — Supabase Studio 또는 supabase CLI로 직접 (Jayden 수동, 🔴)

4. **drizzle journal/snapshot은 건드리지 않음** (현재 hybrid 상태 유지)

## RLS 정책 패턴 (0017, 0019 참조)

- `auth.uid()` → `(select auth.uid())`로 InitPlan 변환 의무 (advisor `auth_rls_initplan` 회피)
- 현재 application은 service_role direct connection → 모든 정책 bypass
  - 정책은 향후 anon/authenticated 키 사용 시점의 차단선 + 의도 명세
- ROLLBACK SQL 주석 의무

## Drizzle Studio (RLS bypass — 모든 row 보임)

```bash
pnpm --filter @hesya/database db:studio
```

## 향후 정리 (선택, 우선순위 낮음)

이 hybrid 상태를 정리하려면 별도 baseline migration 작업 필요.

- 옵션 A: 모든 manual SQL을 squash → drizzle 초기화로 흡수
- 옵션 B: drizzle 사용 중단, 전체 manual SQL로 전환
- 결정 시기: 베타 5곳 배포 후 (Phase 2)

## Schema 파일 컨벤션

- 한 테이블 = 한 파일 (`<table-kebab-case>.ts`)
- Better Auth 테이블은 `auth/` 하위
- FK는 `references(() => <table>.<col>, { onDelete: "..." })` 명시

## 관련

- `apps/web/src/shared/lib/dal/` — 이 schema를 소비하는 DAL 모듈
- 글로벌 `~/.claude/rules/inventory-protocol.md` — 새 테이블 추가 전 인벤토리 의무
