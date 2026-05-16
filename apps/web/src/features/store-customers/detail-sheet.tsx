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
  readonly kpiVisitsLabel: string;
  readonly kpiVisitsUnit: string;
  readonly kpiLtvLabel: string;
  readonly kpiLtvUnit: string;
  readonly kpiLtvFootAvg: string;
  readonly kpiLastLabel: string;
  readonly kpiLastFootPlaceholder: string;
  readonly kpiNextLabel: string;
  readonly kpiNextFootEmpty: string;
}

interface Props {
  readonly row: CustomerRow | null;
  readonly onClose: () => void;
  readonly labels: DetailSheetLabels;
  /** "modal" = fixed inset-0 + backdrop (default, mobile/tablet).
   *  "inline" = relative h-full embedded column (desktop split-view). */
  readonly mode?: "modal" | "inline";
}

type TabKey = "profile" | "notes" | "history" | "tags";

const TABS: ReadonlyArray<{ key: TabKey; labelKey: keyof DetailSheetLabels }> =
  [
    { key: "profile", labelKey: "tabProfile" },
    { key: "notes", labelKey: "tabNotes" },
    { key: "history", labelKey: "tabHistory" },
    { key: "tags", labelKey: "tabTags" },
  ];

export function DetailSheet({ row, onClose, labels, mode = "modal" }: Props) {
  if (!row) return null;
  return (
    <DetailSheetInner
      key={row.id}
      row={row}
      onClose={onClose}
      labels={labels}
      mode={mode}
    />
  );
}

function DetailSheetInner({
  row,
  onClose,
  labels,
  mode,
}: {
  row: CustomerRow;
  onClose: () => void;
  labels: DetailSheetLabels;
  mode: "modal" | "inline";
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

  const inner = (
    <aside
      className={
        mode === "inline"
          ? "sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-hesya-peach-200 bg-white shadow-[0_2px_8px_rgba(26,34,56,0.04),0_4px_16px_rgba(26,34,56,0.06)]"
          : "relative flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl"
      }
    >
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

      <KpiStrip row={row} labels={labels} />

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
          <EmptyState icon="🕓" text={labels.historyPlaceholder} />
        ) : null}

        {tab === "tags" ? (
          <EmptyState icon="🏷" text={labels.tagsPlaceholder} />
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
  );

  if (mode === "inline") {
    return inner;
  }

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
      {inner}
    </div>
  );
}

function KpiStrip({
  row,
  labels,
}: {
  row: CustomerRow;
  labels: DetailSheetLabels;
}) {
  const visits = row.totalVisits ?? 0;
  const ltvKrw = row.ltvKrw ?? 0;
  const avgPerVisit =
    visits > 0 && ltvKrw > 0 ? (ltvKrw / visits / 10000).toFixed(1) : null;
  const ltvMan = ltvKrw > 0 ? Math.round(ltvKrw / 10000).toLocaleString() : "0";

  return (
    <div
      className="grid grid-cols-4 gap-px border-b border-hesya-peach-200 bg-hesya-peach-200"
      role="group"
      aria-label={`${labels.kpiVisitsLabel} · ${labels.kpiLtvLabel} · ${labels.kpiLastLabel} · ${labels.kpiNextLabel}`}
    >
      <KpiCell
        label={labels.kpiVisitsLabel}
        value={String(visits)}
        unit={labels.kpiVisitsUnit}
        foot={labels.emptyDash}
      />
      <KpiCell
        label={labels.kpiLtvLabel}
        value={`₩${ltvMan}`}
        unit={labels.kpiLtvUnit}
        foot={
          avgPerVisit
            ? labels.kpiLtvFootAvg.replace("{avg}", avgPerVisit)
            : labels.emptyDash
        }
      />
      <KpiCell
        label={labels.kpiLastLabel}
        value={labels.emptyDash}
        small
        foot={labels.kpiLastFootPlaceholder}
      />
      <KpiCell
        label={labels.kpiNextLabel}
        value={labels.emptyDash}
        small
        foot={labels.kpiNextFootEmpty}
      />
    </div>
  );
}

function KpiCell({
  label,
  value,
  unit,
  foot,
  small,
}: {
  label: string;
  value: string;
  unit?: string;
  foot: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 bg-white px-3.5 py-3">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-hesya-navy-900/55">
        {label}
      </div>
      <div
        className={[
          "font-heading font-medium leading-[1.1] tracking-tight text-hesya-navy-900",
          small ? "text-[18px]" : "text-[22px]",
        ].join(" ")}
      >
        {value}
        {unit ? (
          <span className="ml-0.5 font-body text-[12px] text-hesya-navy-900/55">
            {unit}
          </span>
        ) : null}
      </div>
      <div className="text-[10.5px] text-hesya-navy-900/55">{foot}</div>
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

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-hesya-peach-200 bg-hesya-peach-50/40 px-4 py-10 text-center">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-[18px]"
      >
        {icon}
      </span>
      <p className="text-[12px] text-hesya-navy-900/55 [word-break:keep-all]">
        {text}
      </p>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-hesya-navy-900/35">
        coming · M4.x
      </span>
    </div>
  );
}
