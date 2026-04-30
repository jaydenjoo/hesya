# Features — Feature-Based 아키텍처 (v10)

## 절대 규칙

1. **비즈니스 기능은 반드시 이 폴더 아래**
2. **외부 노출은 각 feature의 `index.ts`만**
3. **다른 feature 내부 직접 import 금지**
   - ✅ `import { LoginForm } from '@/features/auth'`
   - ❌ `import { LoginForm } from '@/features/auth/components/LoginForm'`

## 표준 폴더 구조

```
features/{name}/
├── components/      UI (React 컴포넌트)
├── actions/         서버 액션 (use server)
├── hooks/           React 훅
├── lib/             feature 내부 헬퍼
├── types.ts         타입 정의
├── schema.ts        zod 검증 스키마
└── index.ts         ⭐ Public API
```

## 의존 방향

```
app/ (페이지)
  ↓
features/{name}/index.ts
  ↓
features/{name}/components, hooks, lib
  ↓
shared/ui, shared/lib, shared/config
  ↓
외부 라이브러리
```

**금지**: features → 다른 features
**금지**: shared → features

## Server Action 패턴 (Next.js 16.2 권고)

```typescript
"use server";

import { requireAuth } from "@/shared/lib/auth-guard";
import { dal } from "@/shared/lib/dal";

export async function createInvoice(input: CreateInvoiceInput) {
  // 1. 인증 (필수, 첫 줄)
  const session = await requireAuth();

  // 2. 검증 (zod)
  const data = createInvoiceSchema.parse(input);

  // 3. DB 접근 (DAL 통해서만)
  return dal.invoices.create({ ...data, userId: session.userId });
}
```

## Feature vs Shared 판단

**features/**:

- 비즈니스 기능 (auth, payment, dashboard)
- 특정 도메인 묶음
- 독립 작동 가능

**shared/**:

- 여러 feature가 쓰는 UI (Button, Input)
- 순수 유틸 (formatDate, cn)
- 환경변수, DB 클라이언트, 인증 헬퍼

> **가이드**: 2개+ feature가 쓰면 → shared로 이동
