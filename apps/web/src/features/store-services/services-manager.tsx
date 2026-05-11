"use client";

/**
 * Plan v3 M3.1 / Phase D3-C1-a — 매장 시술 관리 (디자인 정합 재구성, shell).
 *
 * 2-panel layout: 좌측 CategorySidebar + 우측 ServiceCard grid.
 * Add/Edit form은 현재 inline (D3-C1-b에서 EditorPanel side-sheet로 분리 예정).
 * 번역률 progress bar (모든 5 non-Ko 이름 완료 비율).
 */

import { useMemo, useState, useTransition } from "react";

import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/lib/store-services/actions";

import { CategorySidebar } from "./category-sidebar";
import { ServiceCard } from "./service-card";

export interface ServiceRow {
  readonly id: string;
  readonly nameKo: string;
  readonly nameEn: string | null;
  readonly nameJa: string | null;
  readonly nameZhCn: string | null;
  readonly nameZhTw: string | null;
  readonly nameVi: string | null;
  readonly priceKrw: number;
  readonly durationMinutes: number | null;
  readonly category: string | null;
}

export interface ServicesManagerLabels {
  readonly addButton: string;
  readonly cancelButton: string;
  readonly saveButton: string;
  readonly editButton: string;
  readonly deleteButton: string;
  readonly nameKoLabel: string;
  readonly nameEnLabel: string;
  readonly nameJaLabel: string;
  readonly priceKrwLabel: string;
  readonly durationLabel: string;
  readonly categoryLabel: string;
  readonly emptyText: string;
  readonly deleteConfirm: string;
  readonly allCategoryLabel: string;
  readonly translatedLabel: string;
  readonly servicesCount: string;
  readonly requiredError: string;
}

interface Props {
  readonly initialRows: ReadonlyArray<ServiceRow>;
  readonly labels: ServicesManagerLabels;
}

type FormState = {
  nameKo: string;
  nameEn: string;
  nameJa: string;
  priceKrw: string;
  durationMinutes: string;
  category: string;
};

const EMPTY_FORM: FormState = {
  nameKo: "",
  nameEn: "",
  nameJa: "",
  priceKrw: "",
  durationMinutes: "",
  category: "",
};

function rowToForm(row: ServiceRow): FormState {
  return {
    nameKo: row.nameKo,
    nameEn: row.nameEn ?? "",
    nameJa: row.nameJa ?? "",
    priceKrw: String(row.priceKrw),
    durationMinutes:
      row.durationMinutes != null ? String(row.durationMinutes) : "",
    category: row.category ?? "",
  };
}

function formToInput(f: FormState) {
  return {
    nameKo: f.nameKo.trim(),
    nameEn: f.nameEn.trim() || null,
    nameJa: f.nameJa.trim() || null,
    priceKrw: Number(f.priceKrw),
    durationMinutes: f.durationMinutes ? Number(f.durationMinutes) : null,
    category: f.category.trim() || null,
  };
}

function categoryKey(c: string | null): string {
  return (c ?? "other").trim().toLowerCase() || "other";
}

function translationCompleteness(rows: ReadonlyArray<ServiceRow>): number {
  if (rows.length === 0) return 0;
  let total = 0;
  for (const r of rows) {
    let filled = 0;
    if (r.nameEn) filled++;
    if (r.nameJa) filled++;
    if (r.nameZhCn) filled++;
    if (r.nameZhTw) filled++;
    if (r.nameVi) filled++;
    total += filled / 5;
  }
  return Math.round((total / rows.length) * 100);
}

export function ServicesManager({ initialRows, labels }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("__all__");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of initialRows) {
      const k = categoryKey(r.category);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialRows]);

  const filteredRows = useMemo(() => {
    if (activeCategory === "__all__") return initialRows;
    return initialRows.filter(
      (r) => categoryKey(r.category) === activeCategory,
    );
  }, [initialRows, activeCategory]);

  const completeness = translationCompleteness(initialRows);

  const handleStartCreate = () => {
    setCreating(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const handleStartEdit = (row: ServiceRow) => {
    setEditingId(row.id);
    setCreating(false);
    setForm(rowToForm(row));
    setError(null);
  };

  const handleCancel = () => {
    setCreating(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.nameKo.trim() || !form.priceKrw) {
      setError(labels.requiredError);
      return;
    }
    const input = formToInput(form);
    startTransition(async () => {
      const result = editingId
        ? await updateServiceAction({ id: editingId, ...input })
        : await createServiceAction(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      handleCancel();
    });
  };

  const handleDelete = (row: ServiceRow) => {
    if (!confirm(`${labels.deleteConfirm}: ${row.nameKo}`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteServiceAction({ id: row.id });
      if (!result.ok) setError(result.message);
    });
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-mono text-[13px] font-medium text-hesya-navy-900">
            {labels.servicesCount.replace("{n}", String(initialRows.length))}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-hesya-peach-100">
              <div
                className="h-full bg-hesya-amber-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-hesya-navy-900/65">
              {completeness}% {labels.translatedLabel}
            </span>
          </div>
        </div>
        {!creating && !editingId ? (
          <button
            type="button"
            onClick={handleStartCreate}
            className="rounded-full bg-hesya-amber-500 px-4 py-2 text-[13px] font-semibold text-hesya-navy-900 transition hover:bg-hesya-amber-600"
          >
            {labels.addButton}
          </button>
        ) : null}
      </div>

      {(creating || editingId) && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded-2xl border border-hesya-peach-200 bg-white px-4 py-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.nameKoLabel}{" "}
                <span className="text-hesya-amber-600">*</span>
              </label>
              <input
                type="text"
                value={form.nameKo}
                onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.nameEnLabel}
              </label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.nameJaLabel}
              </label>
              <input
                type="text"
                value={form.nameJa}
                onChange={(e) => setForm({ ...form, nameJa: e.target.value })}
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.priceKrwLabel}{" "}
                <span className="text-hesya-amber-600">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.priceKrw}
                onChange={(e) => setForm({ ...form, priceKrw: e.target.value })}
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.durationLabel}
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: e.target.value })
                }
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-hesya-navy-900/60">
                {labels.categoryLabel}
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="haircut / color / nail …"
                className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-hesya-navy-900 px-5 py-2 text-[13px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90 disabled:opacity-60"
            >
              {pending ? "…" : labels.saveButton}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-hesya-peach-200 px-5 py-2 text-[13px] font-semibold text-hesya-navy-900 transition hover:border-hesya-amber-500"
            >
              {labels.cancelButton}
            </button>
          </div>
        </form>
      )}

      {error && !creating && !editingId && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <CategorySidebar
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
          allLabel={labels.allCategoryLabel}
        />

        <div className="min-w-0 flex-1">
          {filteredRows.length === 0 ? (
            <p className="rounded-2xl border border-hesya-peach-200 bg-white px-6 py-12 text-center text-sm text-hesya-navy-900/55">
              {labels.emptyText}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRows.map((row) => (
                <ServiceCard
                  key={row.id}
                  row={row}
                  onEdit={handleStartEdit}
                  onDelete={handleDelete}
                  editLabel={labels.editButton}
                  deleteLabel={labels.deleteButton}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
