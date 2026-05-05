"use client";

/**
 * Epic 1B-UI A-4 — Col 3 ContextPanel (4탭).
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 3 ix-col-3) 4탭 구조.
 * 1B 데이터로 채울 수 있는 것 + 1B 스코프 밖 placeholder.
 *
 * **탭별 데이터**:
 * - Info: customerId(8자), 채널, 메시지 수, 첫 대화일
 * - History: 최근 메시지 timeline (최대 5개, 최신순)
 * - Notes: placeholder (Epic 1B-Notes 또는 1C-Memo)
 * - Risk: placeholder (Epic 1C-Risk 또는 1D-Compliance)
 *
 * **1B 스코프 밖** (디자인 ref에 있으나 데이터 없음):
 * - 고객 이름/native/국적 flag, 사용 금액, 선호 디자이너, 알러지 메모
 *   → Customer 테이블 확장 필요 (별 Epic)
 * - payment history → Payments 테이블 (별 Epic 결제)
 *
 * **a11y**: 탭 버튼은 role 무 + aria-selected (단순 toggle 패턴).
 * 완전한 ARIA tablist는 키보드 화살표 네비게이션 필요해서 over-engineering.
 */

import { useState } from "react";
import type { Conversation, Message } from "../types";

type Tab = "info" | "history" | "notes" | "risk";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "Info" },
  { id: "history", label: "History" },
  { id: "notes", label: "Notes" },
  { id: "risk", label: "Risk" },
];

const DATE_FMT = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function ContextPanel({
  conversation,
  messages,
}: {
  conversation: Conversation | null;
  messages: Message[];
}) {
  const [tab, setTab] = useState<Tab>("info");

  if (!conversation) {
    return (
      <div className="kr p-6 text-center text-sm text-gray-500">
        대화를 선택하면 고객 정보가 표시됩니다.
      </div>
    );
  }

  return (
    <>
      <header
        role="tablist"
        className="flex flex-shrink-0 border-b border-hesya-peach-200 bg-white"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              onClick={() => setTab(t.id)}
              aria-selected={active}
              className={
                "kr flex-1 cursor-pointer px-2 py-3 text-xs font-semibold transition-colors " +
                (active
                  ? "border-b-2 border-hesya-amber-500 text-hesya-navy-900"
                  : "border-b-2 border-transparent text-gray-500 hover:text-hesya-navy-900")
              }
            >
              {t.label}
            </button>
          );
        })}
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "info" ? (
          <InfoTab conversation={conversation} messageCount={messages.length} />
        ) : null}
        {tab === "history" ? <HistoryTab messages={messages} /> : null}
        {tab === "notes" ? (
          <p className="kr break-keep text-sm text-gray-500">
            메모 기능은 다음 업데이트에서 추가됩니다.
          </p>
        ) : null}
        {tab === "risk" ? (
          <p className="kr break-keep text-sm text-gray-500">
            위험 신호 감지는 다음 업데이트에서 추가됩니다.
          </p>
        ) : null}
      </div>
    </>
  );
}

function InfoTab({
  conversation,
  messageCount,
}: {
  conversation: Conversation;
  messageCount: number;
}) {
  return (
    <dl className="kr space-y-3 text-sm">
      <div>
        <dt className="text-xs font-semibold text-gray-500">고객 ID</dt>
        <dd className="mono mt-0.5 text-hesya-navy-900">
          {conversation.customerId.slice(0, 8)}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-gray-500">채널</dt>
        <dd className="mt-0.5 text-hesya-navy-900">{conversation.channel}</dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-gray-500">메시지 수</dt>
        <dd
          data-testid="ctx-msg-count"
          className="mono mt-0.5 text-hesya-navy-900"
        >
          {messageCount}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-semibold text-gray-500">첫 대화일</dt>
        <dd className="mono mt-0.5 text-hesya-navy-900">
          {DATE_FMT.format(conversation.createdAt)}
        </dd>
      </div>
    </dl>
  );
}

function HistoryTab({ messages }: { messages: Message[] }) {
  // 최신순 5개 — 디자인 ref ix-ctx-history 패턴.
  const recent = [...messages]
    .sort((a, b) => {
      const ta = a.createdAt?.getTime() ?? 0;
      const tb = b.createdAt?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, 5);

  if (recent.length === 0) {
    return <p className="kr text-sm text-gray-500">아직 메시지가 없습니다.</p>;
  }

  return (
    <ul className="space-y-3">
      {recent.map((m) => (
        <li
          key={m.id}
          data-testid="ctx-history-item"
          className="flex gap-3 border-b border-hesya-peach-200 pb-3 last:border-b-0"
        >
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-hesya-peach-100 text-xs"
            aria-hidden="true"
          >
            {m.direction === "inbound" ? "💬" : "📤"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="kr break-keep text-xs leading-snug text-hesya-navy-900">
              {m.originalText}
            </p>
            <p className="mono mt-1 text-[10px] text-gray-500">
              {m.createdAt ? TIME_FMT.format(m.createdAt) : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
