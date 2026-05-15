/**
 * Sprint 2A PR-A2 — Customer Chat route.
 *
 * Reference: `docs/design/reference/Hesya Chat.html` + `chat-app.jsx`.
 * 외국인 손님 ↔ 매장 사장 간 다국어 채팅 UI. baseline mock 대화 (sample
 * conversation)로 풍부한 시연 데이터 제공.
 *
 * 베타 매장 매칭 후 inbox owner 측 thread와 연결 예정 (Phase 1.5).
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  mockChatDay,
  mockChatMessages,
  mockChatStore,
} from "@/lib/mock-fixtures/chat";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { CustomerChat } from "@/features/customer-chat/customer-chat";
import "./c-chat.css";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CustomerChatPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CustomerChat" });

  return (
    <CustomerFrame>
      <CustomerChat
        storeName={mockChatStore.name}
        storeInitial={mockChatStore.initial}
        responseTime={mockChatStore.responseTime}
        day={mockChatDay}
        messages={mockChatMessages}
        labels={{
          back: t("back"),
          statusOnline: t("statusOnline"),
          statusResponds: t("statusResponds"),
          translateOn: t("translateOn"),
          translateOff: t("translateOff"),
          translateLabel: t("translateLabel"),
          composerPlaceholder: t("composerPlaceholder"),
          composerPhoto: t("composerPhoto"),
          composerVoice: t("composerVoice"),
          composerSend: t("composerSend"),
          aiHint: t("aiHint"),
          aiHintPill: t("aiHintPill"),
          voiceTranscriptLabel: t("voiceTranscriptLabel"),
          auditTitle: t("auditTitle"),
          auditOriginal: t("auditOriginal"),
          auditTranslated: t("auditTranslated"),
          auditConfident: t("auditConfident"),
          auditAmbiguousDefault: t("auditAmbiguousDefault"),
          auditClose: t("auditClose"),
          emptyCap: t("emptyCap"),
          emptyCapEm: t("emptyCapEm"),
          opener1: t("opener1"),
          opener2: t("opener2"),
          opener3: t("opener3"),
          emptyRestore: t("emptyRestore"),
          emptySee: t("emptySee"),
        }}
      />
    </CustomerFrame>
  );
}
