/**
 * Epic 12.9 — 매장 해지·데이터 삭제 Server Actions (PRD §1068, SLA 30일 grace).
 *
 * 인가 체인:
 *   - 사장 자가해지/취소: requireStoreOwnerAuth → checkRateLimit (60s/20회)
 *   - admin 강제해지/취소: requireAdminRole → checkRateLimit (60s/20회)
 *
 * 가드 패턴 차이 (shared/lib/CLAUDE.md):
 *   - requireStoreOwnerAuth → throw
 *   - requireAdminRole → {ok} union
 *
 * 30일 grace 동안 owner는 stores.deleted_at IS NOT NULL 상태로 로그인 가능,
 * inbox/AI 응답은 자연스럽게 빈 결과 → 차단 효과 자동. 취소 시 deleted_at 복원.
 */
"use server";

import { createDbClient } from "@hesya/database";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import {
  cancelStoreDeletion,
  requestStoreDeletion,
  StoreDeletionConflictError,
  StoreDeletionNotFoundError,
} from "@/shared/lib/dal/store-deletion";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const RATE_LIMIT = { max: 20, windowSec: 60 } as const;

const ownerRequestInputSchema = z.object({
  reason: z.string().max(2000).optional(),
});

const adminRequestInputSchema = z.object({
  storeId: z.uuid(),
  reason: z.string().min(1).max(2000),
});

const adminCancelInputSchema = z.object({
  storeId: z.uuid(),
});

export type OwnerDeletionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "conflict";
      message: string;
    };

export type AdminDeletionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "conflict"
        | "not_found";
      message: string;
    };

async function ownerGuardChain(): Promise<
  | {
      ok: true;
      userId: string;
      storeId: string;
      ownerEmail: string;
    }
  | (OwnerDeletionResult & { ok: false })
> {
  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { ok: false, error: "unauthorized", message: err.message };
    }
    if (err instanceof ForbiddenError) {
      return { ok: false, error: "forbidden", message: err.message };
    }
    throw err;
  }

  try {
    await checkRateLimit(`store-deletion-owner:${session.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  // ownerEmail은 Better Auth session에 직접 노출되지 않음 (store-owner-guard
  // 가 userId만 반환). 감사 로그용 email은 Server Action 호출자가 받지 못하므로
  // userId 기반 식별자만 기록 — request row에는 userId + "owner@<userId>" 형식으로.
  return {
    ok: true,
    userId: session.userId,
    storeId: session.storeId,
    ownerEmail: `owner@${session.userId}`,
  };
}

export async function requestOwnerStoreDeletionAction(
  rawInput: unknown,
): Promise<OwnerDeletionResult> {
  const guard = await ownerGuardChain();
  if (!guard.ok) return guard;

  const parsed = ownerRequestInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const db = createDbClient(env.DATABASE_URL);
  try {
    await requestStoreDeletion(db, {
      storeId: guard.storeId,
      source: "owner",
      requestedByEmail: guard.ownerEmail,
      requestedByUserId: guard.userId,
      reason: parsed.data.reason ?? null,
    });
  } catch (err) {
    if (err instanceof StoreDeletionConflictError) {
      return {
        ok: false,
        error: "conflict",
        message: "이미 해지 요청이 진행 중입니다",
      };
    }
    if (err instanceof StoreDeletionNotFoundError) {
      // session.storeId는 store_owners에서 조회한 값이라 정상 흐름에선 발생 X.
      // race condition (cron purge 직후 owner 호출) 방어용 fallback.
      return {
        ok: false,
        error: "forbidden",
        message: "매장을 찾을 수 없습니다",
      };
    }
    throw err;
  }

  return { ok: true };
}

export async function cancelOwnerStoreDeletionAction(): Promise<OwnerDeletionResult> {
  const guard = await ownerGuardChain();
  if (!guard.ok) return guard;

  const db = createDbClient(env.DATABASE_URL);
  const cancelled = await cancelStoreDeletion(db, {
    storeId: guard.storeId,
    cancelledByEmail: guard.ownerEmail,
  });

  if (!cancelled) {
    return {
      ok: false,
      error: "conflict",
      message: "취소할 활성 해지 요청이 없습니다",
    };
  }

  return { ok: true };
}

async function adminGuardChain(): Promise<
  | { ok: true; userId: string; email: string }
  | (AdminDeletionResult & { ok: false })
> {
  const guard = await requireAdminRole();
  if (!guard.ok) {
    return { ok: false, error: guard.error, message: guard.message };
  }
  try {
    await checkRateLimit(`store-deletion-admin:${guard.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }
  return { ok: true, userId: guard.userId, email: guard.email };
}

export async function requestAdminStoreDeletionAction(
  rawInput: unknown,
): Promise<AdminDeletionResult> {
  const guard = await adminGuardChain();
  if (!guard.ok) return guard;

  const parsed = adminRequestInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const db = createDbClient(env.DATABASE_URL);
  try {
    await requestStoreDeletion(db, {
      storeId: parsed.data.storeId,
      source: "admin",
      requestedByEmail: guard.email,
      requestedByUserId: guard.userId,
      reason: parsed.data.reason,
    });
  } catch (err) {
    if (err instanceof StoreDeletionConflictError) {
      return {
        ok: false,
        error: "conflict",
        message: "이미 해지 요청이 진행 중입니다",
      };
    }
    if (err instanceof StoreDeletionNotFoundError) {
      return {
        ok: false,
        error: "not_found",
        message: "해당 매장을 찾을 수 없습니다",
      };
    }
    throw err;
  }

  return { ok: true };
}

export async function cancelAdminStoreDeletionAction(
  rawInput: unknown,
): Promise<AdminDeletionResult> {
  const guard = await adminGuardChain();
  if (!guard.ok) return guard;

  const parsed = adminCancelInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const db = createDbClient(env.DATABASE_URL);
  const cancelled = await cancelStoreDeletion(db, {
    storeId: parsed.data.storeId,
    cancelledByEmail: guard.email,
  });

  if (!cancelled) {
    return {
      ok: false,
      error: "not_found",
      message: "취소할 활성 해지 요청이 없습니다",
    };
  }

  return { ok: true };
}
