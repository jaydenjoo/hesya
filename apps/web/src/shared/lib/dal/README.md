# Data Access Layer (DAL)

> Next.js 16.2 권고 패턴 — DB 접근을 server-only 레이어로 격리.

## 왜?

- DB 쿼리가 컴포넌트/Server Action에 흩어지면:
  - 인증 검증 누락 위험
  - SQL 인젝션 취약점
  - 캐시 일관성 깨짐
- DAL로 모으면:
  - 모든 쿼리 한 곳에서 검증
  - `server-only` 패키지로 클라이언트 노출 차단
  - `React.cache()`로 자동 deduplication

## 구조

```
shared/lib/dal/
├── index.ts          # export const dal = { users, projects, ... }
├── users.ts          # 사용자 관련 쿼리
├── projects.ts       # 프로젝트 관련 쿼리
├── client.ts         # Supabase/Drizzle 클라이언트
└── server-only.ts    # import 'server-only' 강제
```

## 예시

```typescript
// shared/lib/dal/users.ts
import "server-only";
import { cache } from "react";
import { createClient } from "./client";

export const users = {
  // React.cache로 동일 요청 중복 호출 방지
  getById: cache(async (id: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name") // ⚠️ select('*') 금지
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }),
};
```

## 사용 예

```typescript
// features/dashboard/actions/get-stats.ts
"use server";

import { requireAuth } from "@/shared/lib/auth-guard";
import { dal } from "@/shared/lib/dal";

export async function getStats() {
  const session = await requireAuth();
  const user = await dal.users.getById(session.userId);
  const projects = await dal.projects.listByUser(session.userId);
  return { user, projects };
}
```

## 규칙

1. 모든 DB 접근은 DAL을 거친다
2. DAL 함수는 `cache()`로 감싼다
3. 컴포넌트에서 DAL 직접 호출 OK (Server Component 한정)
4. Client Component → Server Action → DAL 순
