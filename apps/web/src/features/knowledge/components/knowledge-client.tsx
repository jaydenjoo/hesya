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

  // Page-level PageHeader가 title/eyebrow 렌더링. 내부에서는 count chip + action.
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="kr inline-flex items-center gap-2 rounded-full bg-hesya-peach-100 px-3 py-1 font-mono text-[11px] font-semibold text-hesya-amber-600">
          <span aria-hidden="true">📚</span>
          {initialFAQs.length}/{maxFAQs}
        </span>
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
