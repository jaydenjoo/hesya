import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeClient } from "@/features/knowledge/components/knowledge-client";
import { MAX_FAQS_PER_STORE } from "@/features/knowledge/schema";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import { OwnerShell } from "@/features/shell/owner-shell";
import { env } from "@/shared/config/env";
import { listStoreKnowledge } from "@/shared/lib/dal/store-knowledge";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Phase D4-D4 — Knowledge (FAQ) owner page. OwnerShell wrap + header pattern.
 */
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
  const [faqs, shell] = await Promise.all([
    listStoreKnowledge(db, session.storeId, { limit: MAX_FAQS_PER_STORE }),
    getOwnerShellData(),
  ]);

  if (!shell) redirect(`/${locale}/sign-in`);

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
    <OwnerShell
      currentLocale={locale}
      storeName={shell.storeName}
      userName={shell.userName}
      userInitial={shell.userInitial}
    >
      <div className="bg-hesya-peach-50">
        <PageHeader
          eyebrow="Operator · Knowledge"
          title="FAQ · 매장 지식"
          subtitle="AI가 손님 질문에 답변할 때 참고하는 매장의 FAQ를 관리합니다."
        />
        <div className="mx-auto max-w-4xl px-8 pb-10">
          <KnowledgeClient
            initialFAQs={initialFAQs}
            maxFAQs={MAX_FAQS_PER_STORE}
          />
        </div>
      </div>
    </OwnerShell>
  );
}
