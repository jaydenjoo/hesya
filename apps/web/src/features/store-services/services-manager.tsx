"use client";

import { useState, useTransition } from "react";

import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/lib/store-services/actions";

export interface ServiceRow {
  readonly id: string;
  readonly nameKo: string;
  readonly nameEn: string | null;
  readonly nameJa: string | null;
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

export function ServicesManager({ initialRows, labels }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

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
      setError("한글 이름과 가격은 필수입니다.");
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
      // Server action revalidatePath로 list 자동 refresh.
    });
  };

  const handleDelete = (row: ServiceRow) => {
    if (!confirm(`${labels.deleteConfirm}: ${row.nameKo}`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteServiceAction({ id: row.id });
      if (!result.ok) {
        setError(result.message);
      }
    });
  };

  const renderForm = () => (
    <form
      onSubmit={handleSubmit}
      className="mb-6 space-y-4 rounded-2xl border border-hesya-peach-200 bg-white px-5 py-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
            {labels.nameKoLabel} <span className="text-hesya-amber-600">*</span>
          </label>
          <input
            type="text"
            value={form.nameKo}
            onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
            className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-sm focus:border-hesya-navy-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
            {labels.nameEnLabel}
          </label>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-sm focus:border-hesya-navy-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
            {labels.nameJaLabel}
          </label>
          <input
            type="text"
            value={form.nameJa}
            onChange={(e) => setForm({ ...form, nameJa: e.target.value })}
            className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-sm focus:border-hesya-navy-900 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
            {labels.priceKrwLabel}{" "}
            <span className="text-hesya-amber-600">*</span>
          </label>
          <input
            type="number"
            min={0}
            step={1000}
            value={form.priceKrw}
            onChange={(e) => setForm({ ...form, priceKrw: e.target.value })}
            className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-sm focus:border-hesya-navy-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
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
            className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-sm focus:border-hesya-navy-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-hesya-navy-900/70">
            {labels.categoryLabel}
          </label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-hesya-peach-200 px-3 py-2 text-sm focus:border-hesya-navy-900 focus:outline-none"
          />
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-hesya-navy-900 px-5 py-2 text-sm font-semibold text-hesya-peach-50 hover:bg-hesya-navy-800 disabled:opacity-60"
        >
          {pending ? "…" : labels.saveButton}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full border border-hesya-peach-200 px-5 py-2 text-sm font-semibold text-hesya-navy-900 hover:border-hesya-amber-500"
        >
          {labels.cancelButton}
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-hesya-navy-900">
          {initialRows.length} 시술
        </h2>
        {!creating && !editingId && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="rounded-full bg-hesya-amber-500 px-5 py-2 text-sm font-semibold text-hesya-navy-900 hover:bg-hesya-amber-400"
          >
            {labels.addButton}
          </button>
        )}
      </div>

      {creating && renderForm()}

      {error && !creating && !editingId && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      {initialRows.length === 0 && !creating ? (
        <p className="rounded-2xl border border-hesya-peach-100 bg-white px-6 py-12 text-center text-sm text-hesya-navy-900/55">
          {labels.emptyText}
        </p>
      ) : (
        <ul className="space-y-2">
          {initialRows.map((row) =>
            editingId === row.id ? (
              <li key={row.id}>{renderForm()}</li>
            ) : (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-hesya-peach-100 bg-white px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-hesya-navy-900">
                    {row.nameKo}
                    {row.nameEn && (
                      <span className="ml-2 text-xs text-hesya-navy-900/55">
                        ({row.nameEn})
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-hesya-navy-900/65">
                    ₩{row.priceKrw.toLocaleString("ko-KR")}
                    {row.durationMinutes && ` · ${row.durationMinutes}분`}
                    {row.category && ` · ${row.category}`}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(row)}
                    disabled={pending}
                    className="rounded-full border border-hesya-peach-200 px-3 py-1.5 text-xs font-semibold text-hesya-navy-900 hover:border-hesya-amber-500 disabled:opacity-50"
                  >
                    {labels.editButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row)}
                    disabled={pending}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {labels.deleteButton}
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
