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
import { safeFormat, toDate } from "@/shared/lib/date-utils";

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

/**
 * O2 100% — mock 국적 flag + 도시 (deterministic by customerId hash).
 * Reference inbox-app.jsx:646-651 `.ix-ctx-flagrow`.
 * 실 nationality DAL wire 별도 task.
 */
const NATIONALITY_CYCLE: ReadonlyArray<{
  readonly flag: string;
  readonly country: string;
  readonly nativeName: string;
  readonly romName: string;
}> = [
  {
    flag: "🇯🇵",
    country: "일본 도쿄",
    nativeName: "佐藤さくら",
    romName: "Sato Sakura",
  },
  { flag: "🇨🇳", country: "중국 상하이", nativeName: "李偉", romName: "Li Wei" },
  {
    flag: "🇺🇸",
    country: "미국 LA",
    nativeName: "Emma Carter",
    romName: "Emma Carter",
  },
  {
    flag: "🇻🇳",
    country: "베트남 호치민",
    nativeName: "Nguyễn Linh",
    romName: "Nguyen Linh",
  },
  {
    flag: "🇰🇷",
    country: "한국 서울",
    nativeName: "김민서",
    romName: "Kim Minseo",
  },
];
function mockNationality(seed: string): (typeof NATIONALITY_CYCLE)[number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (
    NATIONALITY_CYCLE[Math.abs(h) % NATIONALITY_CYCLE.length] ??
    NATIONALITY_CYCLE[0]!
  );
}

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

  const displayName = customer?.name ?? conversation.customerId.slice(0, 8);
  const avatarChar = (displayName.trim().charAt(0) || "?").toUpperCase();
  // O2 100% — mock 국적/도시 (실 nationality DAL wire 별도 task).
  const nat = mockNationality(conversation.customerId);

  return (
    <>
      {/* M6.3e — reference `.ix-ctx-head` 정합: 64px avatar + 이름 + 채널 chip
          O2 100% — 원어 이름 + flag/도시 row 추가 (mock). */}
      <div
        data-testid="ctx-head"
        className="flex flex-shrink-0 flex-col items-center border-b border-hesya-peach-100 px-4 pt-5 pb-3.5 text-center"
      >
        <div className="mb-2.5 flex h-16 w-16 items-center justify-center rounded-full bg-hesya-peach-200 text-[22px] font-semibold text-hesya-navy-900">
          {avatarChar}
        </div>
        <p className="kr text-base font-semibold text-hesya-navy-900">
          {displayName}
        </p>
        <p
          data-testid="ctx-native-name"
          className="mt-0.5 text-[11px] text-gray-700"
        >
          <span>{nat.nativeName}</span>
          <span className="ml-1 text-gray-400">/ {nat.romName}</span>
        </p>
        <p
          data-testid="ctx-flag-row"
          className="kr mt-1 flex items-center justify-center gap-1.5 text-[11px] text-gray-600"
        >
          <span aria-hidden="true">{nat.flag}</span>
          <span>{nat.country}</span>
          <span aria-hidden="true" className="text-gray-300">
            ·
          </span>
          <span>{conversation.channel}</span>
        </p>
      </div>

      {/* M6.3e — reference `.ix-ctx-tabs` 정합: 16% inset 2px amber 활성 indicator */}
      <header
        role="tablist"
        className="flex flex-shrink-0 border-b border-hesya-peach-100 bg-white px-2"
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
                "kr relative flex-1 cursor-pointer px-2 py-3 text-[13px] transition-colors " +
                (active
                  ? "font-semibold text-hesya-navy-900"
                  : "font-medium text-gray-500 hover:text-hesya-navy-900")
              }
            >
              {t.label}
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-px left-[16%] right-[16%] h-[2px] bg-hesya-amber-500"
                />
              ) : null}
            </button>
          );
        })}
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-3.5">
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
        {tab === "risk" ? <RiskTab /> : null}
      </div>
    </>
  );
}

/**
 * M6.3e — reference `.ix-ctx-block` (peach-50 carded info) + `.ix-ctx-key`
 * (uppercase 10px) + `.ix-ctx-val.mono` (18px bold 숫자) 정합.
 *
 * `highlight` variant — peach-100 + amber-500 border (reference 1순위 강조 패턴).
 */
function InfoBlock({
  label,
  children,
  highlight = false,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md px-3 py-2.5 " +
        (highlight
          ? "border border-hesya-amber-500 bg-hesya-peach-100"
          : "bg-hesya-peach-50")
      }
    >
      <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-gray-500">
        {label}
      </p>
      <p
        className={
          (mono
            ? "mono text-[18px] font-bold "
            : "kr text-[13px] font-medium ") + "text-hesya-navy-900"
        }
      >
        {children}
      </p>
    </div>
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
    <div data-testid="ctx-info" className="flex flex-col gap-3">
      <InfoBlock label="Customer ID" mono>
        {conversation.customerId.slice(0, 8)}
      </InfoBlock>
      <InfoBlock label="채널">{conversation.channel}</InfoBlock>
      <div data-testid="ctx-msg-count">
        <InfoBlock label="메시지 수" mono>
          {messageCount}
        </InfoBlock>
      </div>
      {customer ? (
        <>
          <InfoBlock label="방문 횟수" mono highlight>
            {customer.totalVisits ?? 0}
          </InfoBlock>
          <InfoBlock label="사용 금액" mono>
            ₩{KRW_FMT.format(customer.ltvKrw ?? 0)}
          </InfoBlock>
        </>
      ) : null}
      <InfoBlock label="첫 대화일">
        {safeFormat(conversation.createdAt, DATE_FMT)}
      </InfoBlock>
    </div>
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

/**
 * O2 100% — Risk tab mock content (Epic 1C 정식 도입 전 시각 fidelity).
 * Reference inbox-app.jsx:769-808 `.ix-ctx-risk` (warning + ok + emo rows + divider).
 *
 * 실 위험 감지는 Epic 1C-Risk 또는 1D-Compliance — 별도 task. 본 mock은
 * "디자인 시연 가능"을 위한 정적 표시 + "감사 이력 보기" 링크 disabled.
 */
function RiskTab() {
  return (
    <div data-testid="ctx-risk" className="kr flex flex-col gap-2.5 text-sm">
      <div className="flex items-start gap-2.5 rounded-md border border-yellow-200 bg-yellow-50 p-3">
        <span aria-hidden="true" className="text-[16px] text-yellow-700">
          ⚠
        </span>
        <div className="flex-1">
          <p className="font-semibold text-hesya-navy-900">
            마사지 키워드 감지
          </p>
          <p className="mt-0.5 text-[11px] text-gray-600">
            2026.03.12 · 자동 차단됨
          </p>
          <p className="mt-1 text-[12px] text-gray-700">
            &ldquo;머리 마사지도 받을 수 있나요?&rdquo; — 일반 두피 케어 문의로
            판단되어 후속 조치 없음.
          </p>
          <span
            className="mt-2 inline-block cursor-not-allowed text-[11px] text-hesya-amber-600"
            title="곧 출시"
            aria-disabled="true"
          >
            감사 이력 보기 →
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 p-3">
        <span aria-hidden="true" className="text-[16px] text-emerald-700">
          ✓
        </span>
        <div className="flex-1">
          <p className="font-semibold text-hesya-navy-900">최근 30일 무사고</p>
          <p className="mt-0.5 text-[11px] text-gray-600">컴플라이언스 깨끗</p>
        </div>
      </div>

      <div className="my-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-gray-500">
        <span className="h-px flex-1 bg-hesya-peach-200" aria-hidden="true" />
        <span>대화 컨텍스트</span>
        <span className="h-px flex-1 bg-hesya-peach-200" aria-hidden="true" />
      </div>

      <div className="flex items-start gap-2.5 rounded-md bg-hesya-peach-50/50 p-3">
        <span aria-hidden="true" className="text-[16px] text-hesya-amber-600">
          ◐
        </span>
        <div className="flex-1">
          <p className="font-semibold text-hesya-navy-900">감정 무게 — 보통</p>
          <p className="mt-0.5 text-[11px] text-gray-600">
            최근 메시지 톤: 기대 / 호의적
          </p>
          <p className="mt-1 text-[12px] text-gray-700">
            평소와 비슷한 톤이에요. 평상시 응대 방식으로 충분합니다.
          </p>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-gray-400">
        * Epic 1C 도입 시 실 위험 감지 + 감사 이력 자동 wire.
      </p>
    </div>
  );
}

function HistoryTab({ messages }: { messages: Message[] }) {
  // 최신순 5개 — reference `.ix-ctx-history` + `.ix-hist-row` 패턴
  // (peach-50 wrap + 26px white round icon).
  const toMs = (d: Date | string | null | undefined): number =>
    toDate(d)?.getTime() ?? 0;
  const recent = [...messages]
    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) {
    return <p className="kr text-sm text-gray-500">아직 메시지가 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {recent.map((m) => (
        <li
          key={m.id}
          data-testid="ctx-history-item"
          className="flex items-start gap-2.5 rounded-md bg-hesya-peach-50 px-3 py-2.5"
        >
          <div
            className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-white text-xs shadow-sm"
            aria-hidden="true"
          >
            {m.direction === "inbound" ? "💬" : "📤"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="kr break-keep text-xs leading-snug text-hesya-navy-900">
              {m.originalText}
            </p>
            <p className="mono mt-1 text-[10px] text-gray-500">
              {safeFormat(m.createdAt, TIME_FMT, "")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
