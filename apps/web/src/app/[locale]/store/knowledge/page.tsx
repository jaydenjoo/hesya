import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { UnauthorizedError, ForbiddenError } from "@/shared/lib/errors";
import { listStoreKnowledge } from "@/shared/lib/dal/store-knowledge";
import { MAX_FAQS_PER_STORE } from "@/features/knowledge/schema";
import { KnowledgeClient } from "@/features/knowledge/components/knowledge-client";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);
  const faqs = await listStoreKnowledge(db, session.storeId, {
    limit: MAX_FAQS_PER_STORE,
  });

  // 페이지 안전성 — embedding 컬럼은 1536 floats(~12KB)이라 클라이언트 직렬화
  // 비용 큼. UI는 question/answer/id/updatedAt만 필요.
  const initialFAQs = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    hasEmbedding: f.embedding !== null,
    updatedAt: f.updatedAt,
  }));

  return (
    <KnowledgeClient initialFAQs={initialFAQs} maxFAQs={MAX_FAQS_PER_STORE} />
  );
}
