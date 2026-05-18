"use client";

/**
 * Plan v3 M3.1 / Phase D3-C1-a~b — 매장 시술 관리 (디자인 정합 재구성).
 *
 * 2-panel layout: 좌측 CategorySidebar + 우측 ServiceCard grid + 우측 슬라이드
 * EditorPanel (D3-C1-b). 6 언어 (Ko + En + Ja + ZhCn + ZhTw + Vi) 입력.
 * 번역률 progress bar (모든 5 non-Ko 이름 완료 비율).
 */

import { useMemo, useState, useTransition } from "react";

import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/lib/store-services/actions";

import { CategorySidebar } from "./category-sidebar";
import {
  EMPTY_EDITOR_VALUE,
  EditorPanel,
  type EditorFormValue,
  type EditorPanelLabels,
} from "./editor-panel";
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
  readonly editButton: string;
  readonly deleteButton: string;
  readonly emptyText: string;
  readonly deleteConfirm: string;
  readonly allCategoryLabel: string;
  readonly translatedLabel: string;
  readonly servicesCount: string;
  readonly requiredError: string;
  readonly editor: EditorPanelLabels;
}

interface Props {
  readonly initialRows: ReadonlyArray<ServiceRow>;
  readonly labels: ServicesManagerLabels;
}

function rowToEditor(row: ServiceRow): EditorFormValue {
  return {
    nameKo: row.nameKo,
    nameEn: row.nameEn ?? "",
    nameJa: row.nameJa ?? "",
    nameZhCn: row.nameZhCn ?? "",
    nameZhTw: row.nameZhTw ?? "",
    nameVi: row.nameVi ?? "",
    priceKrw: String(row.priceKrw),
    durationMinutes:
      row.durationMinutes != null ? String(row.durationMinutes) : "",
    category: row.category ?? "",
  };
}

function editorToInput(f: EditorFormValue) {
  return {
    nameKo: f.nameKo.trim(),
    nameEn: f.nameEn.trim() || null,
    nameJa: f.nameJa.trim() || null,
    nameZhCn: f.nameZhCn.trim() || null,
    nameZhTw: f.nameZhTw.trim() || null,
    nameVi: f.nameVi.trim() || null,
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

interface LocaleBreakdown {
  readonly id: string;
  readonly flag: string;
  readonly pct: number;
  readonly n: number;
}

function localeBreakdown(
  rows: ReadonlyArray<ServiceRow>,
): ReadonlyArray<LocaleBreakdown> {
  if (rows.length === 0) return [];
  const t = rows.length;
  const en = rows.filter((r) => r.nameEn).length;
  const ja = rows.filter((r) => r.nameJa).length;
  const zhCn = rows.filter((r) => r.nameZhCn).length;
  const zhTw = rows.filter((r) => r.nameZhTw).length;
  const vi = rows.filter((r) => r.nameVi).length;
  return [
    { id: "EN", flag: "🇺🇸", pct: Math.round((en / t) * 100), n: en },
    { id: "JA", flag: "🇯🇵", pct: Math.round((ja / t) * 100), n: ja },
    { id: "ZH", flag: "🇨🇳", pct: Math.round((zhCn / t) * 100), n: zhCn },
    { id: "TW", flag: "🇹🇼", pct: Math.round((zhTw / t) * 100), n: zhTw },
    { id: "VI", flag: "🇻🇳", pct: Math.round((vi / t) * 100), n: vi },
  ];
}

export function ServicesManager({ initialRows, labels }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<EditorFormValue>(EMPTY_EDITOR_VALUE);
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
  const breakdown = localeBreakdown(initialRows);
  const open = creating || editingId !== null;

  const handleStartCreate = () => {
    setCreating(true);
    setEditingId(null);
    setForm(EMPTY_EDITOR_VALUE);
    setError(null);
  };

  const handleStartEdit = (row: ServiceRow) => {
    setEditingId(row.id);
    setCreating(false);
    setForm(rowToEditor(row));
    setError(null);
  };

  const handleClose = () => {
    setCreating(false);
    setEditingId(null);
    setForm(EMPTY_EDITOR_VALUE);
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    if (!form.nameKo.trim() || !form.priceKrw) {
      setError(labels.requiredError);
      return;
    }
    const input = editorToInput(form);
    startTransition(async () => {
      const result = editingId
        ? await updateServiceAction({ id: editingId, ...input })
        : await createServiceAction(input);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      handleClose();
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
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
          {breakdown.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {breakdown.map((b) => (
                <span
                  key={b.id}
                  title={`${b.id}: ${b.n}/${initialRows.length} (${b.pct}%)`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] ring-1 ring-hesya-peach-200"
                >
                  <span aria-hidden="true">{b.flag}</span>
                  <span className="text-hesya-navy-900/65">{b.id}</span>
                  <span className="relative inline-block h-1 w-10 overflow-hidden rounded-full bg-hesya-peach-100">
                    <span
                      className={`absolute inset-y-0 left-0 ${
                        b.pct === 100
                          ? "bg-emerald-500"
                          : b.pct >= 50
                            ? "bg-hesya-amber-500"
                            : "bg-hesya-amber-500/40"
                      }`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </span>
                  <span
                    className={`tabular-nums ${
                      b.pct === 100
                        ? "text-emerald-700"
                        : "text-hesya-navy-900/75"
                    }`}
                  >
                    {b.pct}%
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleStartCreate}
          className="inline-flex items-center gap-1 rounded-md bg-hesya-amber-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(166,113,11,0.2)] transition hover:bg-hesya-amber-600"
        >
          <span aria-hidden="true">✨</span> {labels.addButton}
        </button>
      </div>

      {error && !open && (
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

      <EditorPanel
        open={open}
        mode={creating ? "create" : "edit"}
        value={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={handleClose}
        pending={pending}
        error={error}
        labels={labels.editor}
      />
    </div>
  );
}
