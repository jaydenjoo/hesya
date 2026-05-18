"use client";

/**
 * Plan v3 Phase D3-C1-b — Services EditorPanel (right-slide side-sheet).
 *
 * 우측 슬라이드 패널 (overlay + ESC close). 5 언어 탭 (Ko 필수 + 4 추가) +
 * 가격/소요시간/카테고리 + 컴플라이언스 자기신고 블록.
 *
 * AI 번역 제안은 placeholder (Phase D-AI에서 wire — Claude API로 자동 채움).
 * 본 PR은 UI shell + 데이터 흐름만.
 */

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  suggestAllServiceTranslationsAction,
  suggestServiceTranslationAction,
} from "@/lib/store-services/ai-translate";

export type EditorMode = "create" | "edit";

export type EditorFormValue = {
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZhCn: string;
  nameZhTw: string;
  nameVi: string;
  priceKrw: string;
  durationMinutes: string;
  category: string;
};

export const EMPTY_EDITOR_VALUE: EditorFormValue = {
  nameKo: "",
  nameEn: "",
  nameJa: "",
  nameZhCn: "",
  nameZhTw: "",
  nameVi: "",
  priceKrw: "",
  durationMinutes: "",
  category: "",
};

export interface EditorPanelLabels {
  readonly titleCreate: string;
  readonly titleEdit: string;
  readonly closeLabel: string;
  readonly langTabKo: string;
  readonly langTabEn: string;
  readonly langTabJa: string;
  readonly langTabZhCn: string;
  readonly langTabZhTw: string;
  readonly langTabVi: string;
  readonly nameLabel: string;
  readonly aiSuggestLabel: string;
  readonly aiTranslateAllLabel: string;
  readonly aiSuggestNote: string;
  readonly aiProposalThinking: string;
  readonly aiProposalDisclaimer: string;
  readonly aiProposalEdit: string;
  readonly aiProposalDismiss: string;
  readonly aiProposalApply: string;
  readonly priceKrwLabel: string;
  readonly durationLabel: string;
  readonly categoryLabel: string;
  readonly categoryPlaceholder: string;
  readonly complianceTitle: string;
  readonly complianceBody: string;
  readonly saveButton: string;
  readonly cancelButton: string;
  readonly requiredAsterisk: string;
}

interface Props {
  readonly open: boolean;
  readonly mode: EditorMode;
  readonly value: EditorFormValue;
  readonly onChange: (next: EditorFormValue) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
  readonly pending: boolean;
  readonly error: string | null;
  readonly labels: EditorPanelLabels;
}

type LangKey = keyof Pick<
  EditorFormValue,
  "nameKo" | "nameEn" | "nameJa" | "nameZhCn" | "nameZhTw" | "nameVi"
>;

type TargetLang = "en" | "ja" | "zh-CN" | "zh-TW" | "vi";

const LANG_TABS: ReadonlyArray<{
  readonly key: LangKey;
  readonly flag: string;
  readonly labelKey: keyof Pick<
    EditorPanelLabels,
    | "langTabKo"
    | "langTabEn"
    | "langTabJa"
    | "langTabZhCn"
    | "langTabZhTw"
    | "langTabVi"
  >;
  readonly required: boolean;
  readonly targetLang: TargetLang | null;
}> = [
  {
    key: "nameKo",
    flag: "🇰🇷",
    labelKey: "langTabKo",
    required: true,
    targetLang: null,
  },
  {
    key: "nameEn",
    flag: "🇺🇸",
    labelKey: "langTabEn",
    required: false,
    targetLang: "en",
  },
  {
    key: "nameJa",
    flag: "🇯🇵",
    labelKey: "langTabJa",
    required: false,
    targetLang: "ja",
  },
  {
    key: "nameZhCn",
    flag: "🇨🇳",
    labelKey: "langTabZhCn",
    required: false,
    targetLang: "zh-CN",
  },
  {
    key: "nameZhTw",
    flag: "🇹🇼",
    labelKey: "langTabZhTw",
    required: false,
    targetLang: "zh-TW",
  },
  {
    key: "nameVi",
    flag: "🇻🇳",
    labelKey: "langTabVi",
    required: false,
    targetLang: "vi",
  },
];

export function EditorPanel({
  open,
  mode,
  value,
  onChange,
  onSubmit,
  onClose,
  pending,
  error,
  labels,
}: Props) {
  const [activeLang, setActiveLang] =
    useState<(typeof LANG_TABS)[number]["key"]>("nameKo");
  const [aiPending, startAiTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProposal, setAiProposal] = useState<{
    langKey: LangKey;
    targetLang: TargetLang;
    text: string;
  } | null>(null);

  const close = useCallback(() => onClose(), [onClose]);

  const activeTab = LANG_TABS.find((t) => t.key === activeLang) ?? LANG_TABS[0];
  const canSuggest =
    activeTab.targetLang !== null && value.nameKo.trim().length > 0;

  // 활성 탭이 바뀌면 이전 탭의 proposal은 더 이상 유효하지 않음.
  const switchLang = (key: LangKey) => {
    if (key === activeLang) return;
    setActiveLang(key);
    setAiProposal(null);
    setAiError(null);
  };

  const handleAiSuggest = () => {
    if (!activeTab.targetLang || !value.nameKo.trim()) return;
    setAiError(null);
    const targetLang = activeTab.targetLang;
    const langKey = activeTab.key;
    // proposal card 즉시 열어 shimmer(thinking) 상태 노출.
    setAiProposal({ langKey, targetLang, text: "" });
    startAiTransition(async () => {
      const result = await suggestServiceTranslationAction({
        nameKo: value.nameKo,
        targetLang,
      });
      if (!result.ok) {
        setAiError(result.message);
        setAiProposal(null);
        return;
      }
      setAiProposal({ langKey, targetLang, text: result.translation });
    });
  };

  const handleProposalApply = () => {
    if (!aiProposal) return;
    onChange({ ...value, [aiProposal.langKey]: aiProposal.text });
    setAiProposal(null);
  };
  const handleProposalEdit = () => {
    if (!aiProposal) return;
    onChange({ ...value, [aiProposal.langKey]: aiProposal.text });
    setAiProposal(null);
  };
  const handleProposalDismiss = () => {
    setAiProposal(null);
  };

  const handleAiTranslateAll = () => {
    if (!value.nameKo.trim()) return;
    setAiError(null);
    startAiTransition(async () => {
      const result = await suggestAllServiceTranslationsAction({
        nameKo: value.nameKo,
      });
      if (!result.ok) {
        setAiError(result.message);
        return;
      }
      onChange({
        ...value,
        nameEn: result.translations.en || value.nameEn,
        nameJa: result.translations.ja || value.nameJa,
        nameZhCn: result.translations["zh-CN"] || value.nameZhCn,
        nameZhTw: result.translations["zh-TW"] || value.nameZhTw,
        nameVi: result.translations.vi || value.nameVi,
      });
    });
  };

  const canBatchTranslate = value.nameKo.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [open, close]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? labels.titleCreate : labels.titleEdit}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 bg-hesya-navy-900/40 backdrop-blur-sm"
      />

      <form
        onSubmit={handleSubmit}
        className="relative flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-hesya-peach-200 px-5 py-3">
          <h2 className="font-heading text-lg font-semibold italic tracking-tight text-hesya-navy-900">
            {mode === "create" ? labels.titleCreate : labels.titleEdit}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label={labels.closeLabel}
            className="grid h-8 w-8 place-items-center rounded-full text-hesya-navy-900/65 transition hover:bg-hesya-peach-50"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
              {labels.nameLabel}
            </p>
            <button
              type="button"
              onClick={handleAiTranslateAll}
              disabled={!canBatchTranslate || aiPending}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition",
                canBatchTranslate && !aiPending
                  ? "border-hesya-amber-500/40 bg-hesya-amber-50 text-hesya-navy-900 hover:border-hesya-amber-500 hover:bg-hesya-amber-100"
                  : "cursor-not-allowed border-hesya-peach-200 bg-hesya-peach-50/40 text-hesya-navy-900/50",
              ].join(" ")}
            >
              <span aria-hidden="true">{aiPending ? "…" : "✦"}</span>
              {labels.aiTranslateAllLabel}
            </button>
          </div>
          <div
            className="-mx-5 mb-3 flex gap-1 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {LANG_TABS.map((tab) => {
              const filled = !!value[tab.key];
              const isActive = activeLang === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => switchLang(tab.key)}
                  className={[
                    "relative flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition",
                    isActive
                      ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                      : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500",
                  ].join(" ")}
                >
                  <span aria-hidden="true">{tab.flag}</span>
                  <span className="font-semibold">{labels[tab.labelKey]}</span>
                  {tab.required ? (
                    <span
                      className={
                        isActive
                          ? "text-hesya-amber-500"
                          : "text-hesya-amber-600"
                      }
                    >
                      {labels.requiredAsterisk}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={[
                        "h-1.5 w-1.5 rounded-full",
                        filled
                          ? isActive
                            ? "bg-hesya-amber-500"
                            : "bg-emerald-500"
                          : isActive
                            ? "bg-hesya-peach-50/30"
                            : "bg-hesya-peach-200",
                      ].join(" ")}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={value[activeLang]}
            onChange={(e) =>
              onChange({ ...value, [activeLang]: e.target.value })
            }
            maxLength={100}
            className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[14px] focus:border-hesya-navy-900 focus:outline-none"
          />

          {activeLang !== "nameKo" ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={!canSuggest || aiPending}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                  canSuggest && !aiPending
                    ? "border-hesya-amber-500/40 bg-hesya-amber-50 text-hesya-navy-900 hover:border-hesya-amber-500 hover:bg-hesya-amber-100"
                    : "cursor-not-allowed border-hesya-peach-200 bg-hesya-peach-50/40 text-hesya-navy-900/55",
                ].join(" ")}
                title={!value.nameKo.trim() ? labels.aiSuggestNote : undefined}
              >
                <span aria-hidden="true">{aiPending ? "…" : "✦"}</span>
                {labels.aiSuggestLabel}
              </button>
              {aiError ? (
                <p role="alert" className="mt-1 text-[10px] text-red-700">
                  {aiError}
                </p>
              ) : !value.nameKo.trim() ? (
                <p className="mt-1 text-[10px] text-hesya-navy-900/50">
                  {labels.aiSuggestNote}
                </p>
              ) : null}

              {/* Reference services-app.jsx L13-83 + services.css L969-1115 — AI 번역 제안 카드.
                  shimmer(thinking) → content + 3 actions(직접 수정/버리기/적용) 흐름. */}
              {aiProposal ? (
                <div
                  role="dialog"
                  aria-label={labels.aiSuggestLabel}
                  className="mt-3 rounded-xl border border-hesya-amber-500/40 bg-gradient-to-b from-hesya-amber-500/[0.08] to-hesya-amber-500/[0.02] p-3.5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-hesya-amber-600">
                      <span aria-hidden="true">✦</span>
                      {labels.aiSuggestLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleProposalDismiss}
                      aria-label={labels.closeLabel}
                      className="text-[16px] leading-none text-gray-500 hover:text-hesya-navy-900"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mb-2.5 flex items-center gap-2 text-[11px] text-gray-700">
                    <span className="font-semibold text-hesya-navy-900">
                      {labels.langTabKo}
                    </span>
                    <span className="text-hesya-amber-500">→</span>
                    <span className="font-semibold text-hesya-navy-900">
                      {labels[activeTab.labelKey]}
                    </span>
                    <span className="ml-auto font-heading text-[10px] italic text-gray-500">
                      {labels.aiProposalDisclaimer}
                    </span>
                  </div>
                  {aiPending || !aiProposal.text ? (
                    <div className="py-2">
                      <div className="mb-3 flex flex-col gap-1.5">
                        <span
                          aria-hidden="true"
                          className="sv-think-line"
                          style={{ width: "80%" }}
                        />
                        <span
                          aria-hidden="true"
                          className="sv-think-line"
                          style={{ width: "95%" }}
                        />
                        <span
                          aria-hidden="true"
                          className="sv-think-line"
                          style={{ width: "60%" }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-hesya-amber-600">
                        <span aria-hidden="true">✦</span>
                        <span>{labels.aiProposalThinking}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2.5 rounded-md bg-white px-3.5 py-3 text-[13px] leading-[1.55] text-hesya-navy-900">
                        {aiProposal.text}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={handleProposalEdit}
                          className="rounded-md border border-hesya-peach-200 bg-transparent px-2.5 py-1.5 text-[11px] text-gray-700 transition hover:border-hesya-amber-500"
                        >
                          {labels.aiProposalEdit}
                        </button>
                        <button
                          type="button"
                          onClick={handleProposalDismiss}
                          className="rounded-md border border-hesya-peach-200 bg-transparent px-2.5 py-1.5 text-[11px] text-gray-700 transition hover:border-hesya-amber-500"
                        >
                          {labels.aiProposalDismiss}
                        </button>
                        <button
                          type="button"
                          onClick={handleProposalApply}
                          className="ml-auto inline-flex items-center gap-1 rounded-md bg-hesya-amber-500 px-3 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-hesya-amber-600"
                        >
                          <span aria-hidden="true">✓</span>
                          <span>{labels.aiProposalApply}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/60">
                {labels.priceKrwLabel}{" "}
                <span className="text-hesya-amber-600">
                  {labels.requiredAsterisk}
                </span>
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={value.priceKrw}
                onChange={(e) =>
                  onChange({ ...value, priceKrw: e.target.value })
                }
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 font-mono text-[14px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/60">
                {labels.durationLabel}
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={value.durationMinutes}
                onChange={(e) =>
                  onChange({ ...value, durationMinutes: e.target.value })
                }
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 font-mono text-[14px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/60">
              {labels.categoryLabel}
            </label>
            <input
              type="text"
              value={value.category}
              onChange={(e) => onChange({ ...value, category: e.target.value })}
              placeholder={labels.categoryPlaceholder}
              className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[14px] focus:border-hesya-navy-900 focus:outline-none"
            />
          </div>

          <section className="mt-6 rounded-2xl border border-hesya-amber-500/30 bg-hesya-amber-50/40 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/65">
              {labels.complianceTitle}
            </p>
            <p className="text-[11px] leading-relaxed text-hesya-navy-900/75">
              {labels.complianceBody}
            </p>
          </section>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
            >
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex gap-2 border-t border-hesya-peach-200 px-5 py-3">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-full bg-hesya-navy-900 px-5 py-2.5 text-[13px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90 disabled:opacity-60"
          >
            {pending ? "…" : labels.saveButton}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-hesya-peach-200 px-5 py-2.5 text-[13px] font-semibold text-hesya-navy-900 transition hover:border-hesya-amber-500"
          >
            {labels.cancelButton}
          </button>
        </footer>
      </form>
    </div>
  );
}
