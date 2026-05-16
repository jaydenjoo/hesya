/**
 * Phase B-4c — 매장 FAQ 관리 미니멀 UI.
 *
 * 디자인 ref(`docs/design/reference/`)에 본 페이지 시안 없음 → hesya
 * 토큰만 사용한 미니멀 레이아웃. 디자인 ref 추가 시 별 PR로 교체.
 */
"use client";

import { useState, useTransition } from "react";
import { createFAQ, updateFAQ, deleteFAQ } from "../actions/manage-faq";

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  hasEmbedding: boolean;
  updatedAt: Date;
};

export function KnowledgeClient({
  initialFAQs,
  maxFAQs,
}: {
  initialFAQs: FAQItem[];
  maxFAQs: number;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Page-level PageHeader가 title/eyebrow 렌더링.
  const embedReadyCount = initialFAQs.filter((f) => f.hasEmbedding).length;
  const embedReadyPct =
    initialFAQs.length === 0
      ? 0
      : Math.round((embedReadyCount / initialFAQs.length) * 100);
  const latestUpdate =
    initialFAQs.length === 0
      ? null
      : initialFAQs.reduce(
          (latest, f) => (f.updatedAt > latest ? f.updatedAt : latest),
          initialFAQs[0]!.updatedAt,
        );
  const capacityPct = Math.round((initialFAQs.length / maxFAQs) * 100);
  const capacityTone: "default" | "warn" | "danger" =
    capacityPct >= 90 ? "danger" : capacityPct >= 70 ? "warn" : "default";

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FAQStatTile
          label="등록 FAQ"
          value={initialFAQs.length}
          suffix={`/ ${maxFAQs}`}
          progress={capacityPct}
          tone={capacityTone}
        />
        <FAQStatTile
          label="AI 임베딩 완료"
          value={embedReadyCount}
          suffix={initialFAQs.length === 0 ? "" : `· ${embedReadyPct}%`}
          tone={embedReadyPct === 100 ? "ok" : "default"}
          alertNote={
            initialFAQs.length === 0
              ? "FAQ 추가 시 자동 임베딩"
              : embedReadyPct === 100
                ? "검색·답변 100% 준비"
                : `${initialFAQs.length - embedReadyCount}건 임베딩 대기`
          }
        />
        <FAQStatTile
          label="잔여 슬롯"
          value={Math.max(0, maxFAQs - initialFAQs.length)}
          suffix="건"
          tone={capacityTone === "danger" ? "danger" : "default"}
        />
        <FAQStatTile
          label="최근 수정"
          value={latestUpdate ? formatRelativeKr(latestUpdate) : "—"}
          tone="default"
          alertNote={
            latestUpdate ? latestUpdate.toISOString().slice(0, 10) : ""
          }
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        {!showAdd && initialFAQs.length < maxFAQs ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="kr inline-flex items-center gap-1.5 rounded-md bg-hesya-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600"
          >
            + FAQ 추가
          </button>
        ) : null}
      </div>

      {showAdd ? (
        <FAQForm
          mode="create"
          onCancel={() => setShowAdd(false)}
          onDone={() => setShowAdd(false)}
        />
      ) : null}

      {initialFAQs.length === 0 ? (
        <div className="mt-2 flex flex-col items-center gap-2.5 rounded-md bg-hesya-peach-50 px-8 py-12 text-center">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-lg"
          >
            ✨
          </div>
          <p className="kr break-keep text-[13px] text-gray-500">
            아직 등록된 FAQ가 없습니다.
            <br />
            &quot;+ FAQ 추가&quot;로 첫 질문/답변을 등록해 보세요.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {initialFAQs.map((faq) =>
            editingId === faq.id ? (
              <li key={faq.id}>
                <FAQForm
                  mode="edit"
                  initialFAQ={faq}
                  onCancel={() => setEditingId(null)}
                  onDone={() => setEditingId(null)}
                />
              </li>
            ) : (
              <FAQRow
                key={faq.id}
                faq={faq}
                onEdit={() => setEditingId(faq.id)}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}

function FAQRow({ faq, onEdit }: { faq: FAQItem; onEdit: () => void }) {
  const [isDeleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`"${faq.question}" FAQ를 삭제할까요?`)) return;
    setError(null);
    startDelete(async () => {
      try {
        await deleteFAQ({ id: faq.id });
      } catch (err) {
        setError(err instanceof Error ? err.message : "삭제 실패");
      }
    });
  }

  return (
    <li className="kr rounded-lg border border-hesya-peach-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="break-keep font-semibold text-hesya-navy-900">
            Q. {faq.question}
          </p>
          <p className="mt-1 break-keep text-sm leading-[1.65] text-gray-700">
            A. {faq.answer}
          </p>
          {!faq.hasEmbedding ? (
            <p className="mt-2 text-xs text-hesya-amber-600">
              <span aria-hidden="true">⚠️ </span>
              임베딩 미생성 — 검색에 노출되지 않습니다. 수정 시 재생성 시도.
            </p>
          ) : null}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={isDeleting}
            className="rounded-md border border-hesya-peach-200 px-3 py-1 text-xs font-medium text-gray-700 not-disabled:cursor-pointer not-disabled:hover:border-hesya-amber-500 disabled:opacity-50"
          >
            수정
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md border border-hesya-peach-200 px-3 py-1 text-xs font-medium text-red-700 not-disabled:cursor-pointer not-disabled:hover:border-red-500 disabled:opacity-50"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </li>
  );
}

type FAQFormProps =
  | {
      mode: "create";
      initialFAQ?: never;
      onCancel: () => void;
      onDone: () => void;
    }
  | {
      mode: "edit";
      initialFAQ: FAQItem;
      onCancel: () => void;
      onDone: () => void;
    };

function FAQForm(props: FAQFormProps) {
  const { mode, onCancel, onDone } = props;
  const initialFAQ = mode === "edit" ? props.initialFAQ : undefined;
  const [question, setQuestion] = useState(initialFAQ?.question ?? "");
  const [answer, setAnswer] = useState(initialFAQ?.answer ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSave(async () => {
      try {
        if (mode === "create") {
          await createFAQ({ question, answer });
        } else {
          await updateFAQ({ id: props.initialFAQ.id, question, answer });
        }
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장 실패");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="kr rounded-lg border border-hesya-amber-500 bg-hesya-peach-50 p-4"
    >
      <label className="block text-sm font-semibold text-hesya-navy-900">
        질문
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          required
          disabled={isSaving}
          className="mt-1 w-full break-keep rounded-md border border-hesya-peach-200 bg-white px-3 py-2 text-sm font-medium text-hesya-navy-900 disabled:opacity-50"
          placeholder="예: 단발 가능한가요?"
        />
      </label>
      <label className="mt-3 block text-sm font-semibold text-hesya-navy-900">
        답변
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          maxLength={2000}
          required
          rows={3}
          disabled={isSaving}
          className="mt-1 w-full break-keep rounded-md border border-hesya-peach-200 bg-white px-3 py-2 text-sm leading-[1.65] text-hesya-navy-900 disabled:opacity-50"
          placeholder="예: 네 가능합니다 (5만원). DM으로 예약 받습니다."
        />
      </label>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isSaving || !question.trim() || !answer.trim()}
          className="rounded-md bg-hesya-amber-500 px-4 py-2 text-xs font-semibold text-white not-disabled:cursor-pointer not-disabled:hover:bg-hesya-amber-600 disabled:opacity-50"
        >
          {isSaving ? "저장 중..." : mode === "create" ? "추가" : "수정 저장"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-md border border-hesya-peach-200 px-4 py-2 text-xs font-medium text-gray-700 not-disabled:cursor-pointer not-disabled:hover:border-hesya-amber-500 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function formatRelativeKr(d: Date): string {
  const now = Date.now();
  const diffMs = now - d.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return d.toISOString().slice(0, 10);
}

function FAQStatTile({
  label,
  value,
  suffix,
  progress,
  alertNote,
  tone,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  progress?: number;
  alertNote?: string;
  tone: "default" | "warn" | "danger" | "ok";
}) {
  const styles = {
    default: {
      border: "border-gray-200",
      bg: "bg-white",
      text: "text-hesya-navy-900",
      bar: "bg-hesya-amber-500",
      note: "text-hesya-navy-900/55",
    },
    warn: {
      border: "border-hesya-peach-200",
      bg: "bg-hesya-peach-50",
      text: "text-hesya-amber-600",
      bar: "bg-hesya-amber-500",
      note: "text-hesya-amber-600",
    },
    danger: {
      border: "border-[#e5c0ba]",
      bg: "bg-[#faefec]",
      text: "text-[#c9483a]",
      bar: "bg-[#c9483a]",
      note: "text-[#c9483a]",
    },
    ok: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/60",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
      note: "text-emerald-700/85",
    },
  }[tone];
  return (
    <div className={`rounded-md border p-4 ${styles.border} ${styles.bg}`}>
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`font-heading text-[24px] font-medium italic leading-none tracking-[-0.02em] ${styles.text}`}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[11px] font-medium text-gray-500">
            {suffix}
          </span>
        )}
      </div>
      {progress != null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-hesya-navy-900/8">
          <div
            className={`h-full rounded-full ${styles.bar}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      {alertNote && (
        <div
          className={`mt-1.5 text-[10.5px] font-medium ${styles.note} [word-break:keep-all]`}
        >
          {alertNote}
        </div>
      )}
    </div>
  );
}
