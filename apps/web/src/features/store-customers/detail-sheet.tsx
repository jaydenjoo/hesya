"use client";

/**
 * Plan v3 M3.2 / Phase D3-C2 — Customer DetailSheet (right-slide).
 *
 * 4 tabs: Profile / Notes / History / Tags. 현재 DAL이 제공하는 필드는 Profile +
 * Notes (allergy + preferredDesigner). History/Tags는 placeholder (M4.x booker
 * 통합 시 채워질 예정).
 *
 * Notes 탭은 기존 inline 편집 기능을 흡수 — allergy/preferredDesigner 편집 +
 * `updateCustomerNotesAction` 호출.
 */

import { useCallback, useEffect, useState, useTransition } from "react";

import { updateCustomerNotesAction } from "@/lib/store-customers/actions";

import type { CustomerRow } from "./types";

export interface DetailSheetLabels {
  readonly closeLabel: string;
  readonly tabProfile: string;
  readonly tabNotes: string;
  readonly tabHistory: string;
  readonly tabTags: string;
  readonly profileChannel: string;
  readonly profileLanguage: string;
  readonly profileNationality: string;
  readonly profileVisits: string;
  readonly profileLtv: string;
  readonly profileExternalId: string;
  readonly notesAllergyLabel: string;
  readonly notesDesignerLabel: string;
  readonly allergyPlaceholder: string;
  readonly preferredDesignerPlaceholder: string;
  readonly saveButton: string;
  readonly cancelButton: string;
  readonly historyPlaceholder: string;
  readonly tagsPlaceholder: string;
  readonly unknownName: string;
  readonly emptyDash: string;
}

interface Props {
  readonly row: CustomerRow | null;
  readonly onClose: () => void;
  readonly labels: DetailSheetLabels;
}

type TabKey = "profile" | "notes" | "history" | "tags";

const TABS: ReadonlyArray<{ key: TabKey; labelKey: keyof DetailSheetLabels }> =
  [
    { key: "profile", labelKey: "tabProfile" },
    { key: "notes", labelKey: "tabNotes" },
    { key: "history", labelKey: "tabHistory" },
    { key: "tags", labelKey: "tabTags" },
  ];

export function DetailSheet({ row, onClose, labels }: Props) {
  if (!row) return null;
  return (
    <DetailSheetInner
      key={row.id}
      row={row}
      onClose={onClose}
      labels={labels}
    />
  );
}

function DetailSheetInner({
  row,
  onClose,
  labels,
}: {
  row: CustomerRow;
  onClose: () => void;
  labels: DetailSheetLabels;
}) {
  const [tab, setTab] = useState<TabKey>("profile");
  const [allergy, setAllergy] = useState(row.allergyNote ?? "");
  const [preferred, setPreferred] = useState(row.preferredDesigner ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [close]);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateCustomerNotesAction({
        customerId: row.id,
        allergyNote: allergy.trim() || null,
        preferredDesigner: preferred.trim() || null,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      close();
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={row.name ?? labels.unknownName}
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        aria-hidden="true"
        onClick={close}
        className="absolute inset-0 bg-hesya-navy-900/40 backdrop-blur-sm"
      />

      <aside className="relative flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-hesya-peach-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-hesya-peach-100 text-sm font-semibold text-hesya-navy-900"
            >
              {(row.name ?? "·").trim().charAt(0).toUpperCase() || "·"}
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold italic tracking-tight text-hesya-navy-900">
                {row.name ?? labels.unknownName}
              </h2>
              <p className="text-[11px] text-hesya-navy-900/55">
                {row.preferredLanguage?.toUpperCase() ?? labels.emptyDash} ·{" "}
                {row.channel ?? labels.emptyDash}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={labels.closeLabel}
            className="grid h-8 w-8 place-items-center rounded-full text-hesya-navy-900/65 transition hover:bg-hesya-peach-50"
          >
            ✕
          </button>
        </header>

        <nav className="flex gap-1 border-b border-hesya-peach-200 px-3 pt-1.5">
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={[
                  "relative px-3 py-2 text-[12px] font-semibold transition",
                  isActive
                    ? "text-hesya-navy-900"
                    : "text-hesya-navy-900/55 hover:text-hesya-navy-900",
                ].join(" ")}
              >
                {labels[t.labelKey]}
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-px h-[2px] bg-hesya-amber-500"
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === "profile" ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
              <ProfileField
                label={labels.profileChannel}
                value={row.channel ?? labels.emptyDash}
              />
              <ProfileField
                label={labels.profileLanguage}
                value={row.preferredLanguage?.toUpperCase() ?? labels.emptyDash}
              />
              <ProfileField
                label={labels.profileNationality}
                value={row.nationality?.toUpperCase() ?? labels.emptyDash}
              />
              <ProfileField
                label={labels.profileVisits}
                mono
                value={String(row.totalVisits ?? 0)}
              />
              <ProfileField
                label={labels.profileLtv}
                mono
                value={
                  row.ltvKrw != null && row.ltvKrw > 0
                    ? `₩${row.ltvKrw.toLocaleString("ko-KR")}`
                    : labels.emptyDash
                }
              />
              <ProfileField
                label={labels.profileExternalId}
                mono
                value={row.externalId ?? labels.emptyDash}
              />
            </dl>
          ) : null}

          {tab === "notes" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/60">
                  {labels.notesAllergyLabel}
                </label>
                <input
                  type="text"
                  value={allergy}
                  onChange={(e) => setAllergy(e.target.value)}
                  placeholder={labels.allergyPlaceholder}
                  className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/60">
                  {labels.notesDesignerLabel}
                </label>
                <input
                  type="text"
                  value={preferred}
                  onChange={(e) => setPreferred(e.target.value)}
                  placeholder={labels.preferredDesignerPlaceholder}
                  className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
                />
              </div>
              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
                >
                  {error}
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "history" ? (
            <p className="rounded-2xl border border-hesya-peach-200 bg-hesya-peach-50/40 px-4 py-8 text-center text-[12px] text-hesya-navy-900/55">
              {labels.historyPlaceholder}
            </p>
          ) : null}

          {tab === "tags" ? (
            <p className="rounded-2xl border border-hesya-peach-200 bg-hesya-peach-50/40 px-4 py-8 text-center text-[12px] text-hesya-navy-900/55">
              {labels.tagsPlaceholder}
            </p>
          ) : null}
        </div>

        {tab === "notes" ? (
          <footer className="flex gap-2 border-t border-hesya-peach-200 px-5 py-3">
            <button
              type="button"
              onClick={handleSave}
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
        ) : null}
      </aside>
    </div>
  );
}

function ProfileField({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-hesya-navy-900/55">
        {label}
      </dt>
      <dd
        className={["text-hesya-navy-900", mono ? "font-mono" : ""].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
