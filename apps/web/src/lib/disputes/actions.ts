/**
 * Epic 12.4 — 분쟁 처리 Server Actions (PRD §1063, SLA 5영업일).
 *
 * 인가 체인:
 *   - 사장 측 (submitDisputeAction): requireStoreOwnerAuth → checkRateLimit (60s/20회)
 *   - admin 측 (set/resolve/reject): requireAdminRole → checkRateLimit (60s/20회)
 *
 * 두 가드가 패턴이 다름 (shared/lib/CLAUDE.md 명시):
 *   - requireStoreOwnerAuth: throw (UnauthorizedError / ForbiddenError)
 *   - requireAdminRole: {ok:true|false} union 반환
 *
 * 알림은 terminal status (resolved / rejected) 시점에 한 번만 발송 — kyc-result
 * 패턴과 동일.
 */
"use server";

import { createDbClient } from "@hesya/database";
import { z } from "zod";

import { env } from "@/shared/config/env";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import {
  createDispute,
  getDispute,
  updateDisputeStatus,
} from "@/shared/lib/dal/disputes";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

import { sendDisputeNotification } from "@/lib/notifications/dispute-result";

const RATE_LIMIT = { max: 20, windowSec: 60 } as const;

const submitInputSchema = z.object({
  conversationId: z.uuid().optional(),
  category: z.enum(["no_show", "refund", "complaint"]),
  description: z.string().min(10).max(2000),
});

const adminActionInputSchema = z.object({
  disputeId: z.uuid(),
  resolution: z.string().min(5).max(2000).optional(),
});

export type SubmitDisputeResult =
  | { ok: true; disputeId: string }
  | {
      ok: false;
      error: "unauthorized" | "forbidden" | "rate_limited" | "invalid_input";
      message: string;
    };

export type AdminDisputeActionResult =
  | { ok: true; disputeId: string }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "forbidden"
        | "rate_limited"
        | "invalid_input"
        | "not_found"
        | "invalid_transition";
      message: string;
    };

export async function submitDisputeAction(
  rawInput: unknown,
): Promise<SubmitDisputeResult> {
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
    await checkRateLimit(`dispute:${session.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  const parsed = submitInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const db = createDbClient(env.DATABASE_URL);
  const dispute = await createDispute(db, {
    storeId: session.storeId,
    filedByUserId: session.userId,
    conversationId: parsed.data.conversationId ?? null,
    category: parsed.data.category,
    description: parsed.data.description,
  });

  return { ok: true, disputeId: dispute.id };
}

type AdminGuardChainResult =
  | { ok: true; userId: string; disputeId: string; resolution?: string }
  | (AdminDisputeActionResult & { ok: false });

async function adminGuardChain(
  rawInput: unknown,
): Promise<AdminGuardChainResult> {
  const guard = await requireAdminRole();
  if (!guard.ok) {
    return { ok: false, error: guard.error, message: guard.message };
  }

  try {
    await checkRateLimit(`dispute-admin:${guard.userId}`, RATE_LIMIT);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return { ok: false, error: "rate_limited", message: err.message };
    }
    throw err;
  }

  const parsed = adminActionInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  return {
    ok: true,
    userId: guard.userId,
    disputeId: parsed.data.disputeId,
    resolution: parsed.data.resolution,
  };
}

export async function setDisputeInReviewAction(
  rawInput: unknown,
): Promise<AdminDisputeActionResult> {
  const guarded = await adminGuardChain(rawInput);
  if (!guarded.ok) return guarded;

  const db = createDbClient(env.DATABASE_URL);
  const updated = await updateDisputeStatus(db, guarded.disputeId, {
    status: "in_review",
    resolvedByUserId: guarded.userId,
  });

  if (!updated) {
    return {
      ok: false,
      error: "invalid_transition",
      message: "분쟁이 open 상태가 아닙니다",
    };
  }

  return { ok: true, disputeId: updated.id };
}

export async function resolveDisputeAction(
  rawInput: unknown,
): Promise<AdminDisputeActionResult> {
  return finalizeDispute("resolved", rawInput);
}

export async function rejectDisputeAction(
  rawInput: unknown,
): Promise<AdminDisputeActionResult> {
  return finalizeDispute("rejected", rawInput);
}

async function finalizeDispute(
  status: "resolved" | "rejected",
  rawInput: unknown,
): Promise<AdminDisputeActionResult> {
  const guarded = await adminGuardChain(rawInput);
  if (!guarded.ok) return guarded;

  const db = createDbClient(env.DATABASE_URL);
  const before = await getDispute(db, guarded.disputeId);
  if (!before) {
    return {
      ok: false,
      error: "not_found",
      message: "분쟁을 찾을 수 없습니다",
    };
  }

  const updated = await updateDisputeStatus(db, guarded.disputeId, {
    status,
    resolution: guarded.resolution,
    resolvedByUserId: guarded.userId,
  });

  if (!updated) {
    return {
      ok: false,
      error: "invalid_transition",
      message: "이미 처리된 분쟁입니다",
    };
  }

  // 알림은 terminal 전이 시 1회 발송. 실패해도 Server Action 응답에 영향 없음
  // (kyc-result 패턴 — try/catch + console.error만).
  try {
    await sendDisputeNotification({
      disputeId: updated.id,
      status,
      resolution: updated.resolution,
    });
  } catch (err) {
    console.error("[dispute] 알림 발송 실패:", err);
  }

  return { ok: true, disputeId: updated.id };
}
