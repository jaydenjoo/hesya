"use client";

/**
 * Epic 1B-UI A-4 + Customer 확장 (CC-5) — Col 3 ContextPanel (4탭).
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 3 ix-col-3) 4탭 구조.
 *
 * **탭별 데이터**:
 * - Info: customer name + 채널, 메시지 수, 방문 횟수, 사용 금액(KRW), 첫 대화일
 * - History: 최근 메시지 timeline (최대 5개, 최신순)
 * - Notes: customer.allergyNote / preferredDesigner (사장 메모, CC-6에서 편집)
 * - Risk: placeholder (Epic 1C-Risk 또는 1D-Compliance)
 *
 * **customer prop은 옵셔널** — 데이터 fetch 흐름이 점진적 도입되는 경우 (또는
 * customer 미존재 race) UI가 안전하게 fallback. 미전달 시 기존 1B-UI 동작.
 *
 * **a11y**: 탭 버튼은 role 무 + aria-selected (단순 toggle 패턴).
 */

import { useState, useTransition } from "react";
import type { Conversation, Customer, Message } from "../types";
import { updateCustomerNotes } from "../actions/update-customer-notes";

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

const KRW_FMT = new Intl.NumberFormat("ko-KR");

export function ContextPanel({
  conversation,
  messages,
  customer,
}: {
  conversation: Conversation | null;
  messages: Message[];
  /** Customer 확장 (CC-5) — null/미전달 시 기존 1B-UI fallback. */
  customer?: Customer | null;
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
          <InfoTab
            conversation={conversation}
            messageCount={messages.length}
            customer={customer}
          />
        ) : null}
        {tab === "history" ? <HistoryTab messages={messages} /> : null}
        {tab === "notes" ? (
          <NotesTab conversationId={conversation.id} customer={customer} />
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
  customer,
}: {
  conversation: Conversation;
  messageCount: number;
  customer?: Customer | null;
}) {
  return (
    <dl className="kr space-y-3 text-sm">
      {customer?.name ? (
        <div>
          <dt className="text-xs font-semibold text-gray-500">고객 이름</dt>
          <dd className="kr mt-0.5 text-base font-semibold text-hesya-navy-900">
            {customer.name}
          </dd>
        </div>
      ) : null}
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
      {customer ? (
        <>
          <div>
            <dt className="text-xs font-semibold text-gray-500">방문 횟수</dt>
            <dd className="mono mt-0.5 text-hesya-navy-900">
              {customer.totalVisits ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-gray-500">사용 금액</dt>
            <dd className="mono mt-0.5 text-hesya-navy-900">
              ₩{KRW_FMT.format(customer.ltvKrw ?? 0)}
            </dd>
          </div>
        </>
      ) : null}
      <div>
        <dt className="text-xs font-semibold text-gray-500">첫 대화일</dt>
        <dd className="mono mt-0.5 text-hesya-navy-900">
          {DATE_FMT.format(conversation.createdAt)}
        </dd>
      </div>
    </dl>
  );
}

type NotesNotice = { kind: "ok"; msg: string } | { kind: "err"; msg: string };

function NotesTab({
  conversationId,
  customer,
}: {
  conversationId: string;
  customer?: Customer | null;
}) {
  // customer 데이터가 아직 로드되지 않은 경우 — fallback (caller가 다음 poll에서 채움).
  if (!customer) {
    return (
      <p className="kr break-keep text-sm text-gray-500">
        고객 정보 로딩 중입니다...
      </p>
    );
  }

  // HIGH-1 사후 리뷰: customer.id 변경 시 NotesForm 재마운트 → useState
  // 초기값 stale 방어. caller(inbox-client)가 conversation 전환 시 customer를
  // null → 신규로 갱신하면 key 변경 → form 자동 reset.
  return (
    <NotesForm
      key={customer.id}
      conversationId={conversationId}
      customerId={customer.id}
      initialAllergyNote={customer.allergyNote ?? ""}
      initialPreferredDesigner={customer.preferredDesigner ?? ""}
    />
  );
}

function NotesForm({
  conversationId,
  customerId,
  initialAllergyNote,
  initialPreferredDesigner,
}: {
  conversationId: string;
  customerId: string;
  initialAllergyNote: string;
  initialPreferredDesigner: string;
}) {
  const [allergyNote, setAllergyNote] = useState(initialAllergyNote);
  const [preferredDesigner, setPreferredDesigner] = useState(
    initialPreferredDesigner,
  );
  const [notice, setNotice] = useState<NotesNotice | null>(null);
  const [isSaving, startSaving] = useTransition();

  function handleSave() {
    setNotice(null);
    startSaving(async () => {
      try {
        await updateCustomerNotes({
          conversationId,
          customerId,
          allergyNote: allergyNote.trim() || null,
          preferredDesigner: preferredDesigner.trim() || null,
        });
        setNotice({ kind: "ok", msg: "저장됨" });
      } catch {
        // Server Action에서 captureServerActionError가 이미 Sentry capture.
        setNotice({
          kind: "err",
          msg: "저장 실패. 잠시 후 다시 시도해 주세요.",
        });
      }
    });
  }

  return (
    <div className="kr space-y-3 text-sm">
      <div>
        <label
          htmlFor="ctx-allergy-note"
          className="text-xs font-semibold text-gray-500"
        >
          알러지 메모
        </label>
        <textarea
          id="ctx-allergy-note"
          value={allergyNote}
          onChange={(e) => setAllergyNote(e.target.value)}
          maxLength={500}
          rows={2}
          disabled={isSaving}
          className="kr mt-1 w-full resize-none rounded border border-hesya-peach-200 bg-white p-2 text-sm text-hesya-navy-900"
        />
      </div>
      <div>
        <label
          htmlFor="ctx-preferred-designer"
          className="text-xs font-semibold text-gray-500"
        >
          선호 디자이너
        </label>
        <input
          id="ctx-preferred-designer"
          value={preferredDesigner}
          onChange={(e) => setPreferredDesigner(e.target.value)}
          maxLength={100}
          disabled={isSaving}
          className="kr mt-1 w-full rounded border border-hesya-peach-200 bg-white p-2 text-sm text-hesya-navy-900"
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="kr w-full rounded bg-hesya-navy-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-hesya-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "저장 중..." : "저장"}
      </button>
      {notice ? (
        <p
          className={
            "text-xs " +
            (notice.kind === "ok" ? "text-emerald-700" : "text-destructive")
          }
        >
          {notice.msg}
        </p>
      ) : null}
    </div>
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
