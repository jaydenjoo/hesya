"use client";

import { useState, useTransition } from "react";

import { updateCustomerNotesAction } from "@/lib/store-customers/actions";

export interface CustomerRow {
  readonly id: string;
  readonly name: string | null;
  readonly channel: string | null;
  readonly externalId: string | null;
  readonly nationality: string | null;
  readonly preferredLanguage: string | null;
  readonly totalVisits: number | null;
  readonly ltvKrw: number | null;
  readonly allergyNote: string | null;
  readonly preferredDesigner: string | null;
}

export interface CustomersListLabels {
  readonly columnName: string;
  readonly columnChannel: string;
  readonly columnLanguage: string;
  readonly columnVisits: string;
  readonly columnLtv: string;
  readonly columnAllergyNote: string;
  readonly columnPreferredDesigner: string;
  readonly emptyText: string;
  readonly editButton: string;
  readonly saveButton: string;
  readonly cancelButton: string;
  readonly allergyPlaceholder: string;
  readonly preferredDesignerPlaceholder: string;
  readonly unknownName: string;
}

interface Props {
  readonly rows: ReadonlyArray<CustomerRow>;
  readonly labels: CustomersListLabels;
}

export function CustomersList({ rows, labels }: Props) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [allergy, setAllergy] = useState("");
  const [preferred, setPreferred] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = (row: CustomerRow) => {
    setEditingId(row.id);
    setAllergy(row.allergyNote ?? "");
    setPreferred(row.preferredDesigner ?? "");
    setError(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setAllergy("");
    setPreferred("");
    setError(null);
  };

  const handleSave = (customerId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCustomerNotesAction({
        customerId,
        allergyNote: allergy.trim() || null,
        preferredDesigner: preferred.trim() || null,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      handleCancel();
    });
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-hesya-peach-100 bg-white px-6 py-12 text-center text-sm text-hesya-navy-900/55">
        {labels.emptyText}
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((row) => {
          const editing = editingId === row.id;
          return (
            <li
              key={row.id}
              className="rounded-2xl border border-hesya-peach-100 bg-white px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium text-hesya-navy-900">
                    {row.name ?? labels.unknownName}
                    {row.nationality && (
                      <span className="ml-2 text-xs text-hesya-navy-900/55">
                        · {row.nationality.toUpperCase()}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-hesya-navy-900/65">
                    {row.channel && (
                      <span className="mr-2 rounded-full bg-hesya-peach-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-hesya-navy-900/70">
                        {row.channel}
                      </span>
                    )}
                    {row.preferredLanguage && (
                      <span className="mr-2">
                        {labels.columnLanguage}:{" "}
                        {row.preferredLanguage.toUpperCase()}
                      </span>
                    )}
                    {row.totalVisits != null && row.totalVisits > 0 && (
                      <span className="mr-2">
                        {labels.columnVisits}: {row.totalVisits}
                      </span>
                    )}
                    {row.ltvKrw != null && row.ltvKrw > 0 && (
                      <span>
                        {labels.columnLtv}: ₩
                        {row.ltvKrw.toLocaleString("ko-KR")}
                      </span>
                    )}
                  </p>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit(row)}
                    disabled={pending}
                    className="rounded-full border border-hesya-peach-200 px-3 py-1.5 text-xs font-semibold text-hesya-navy-900 hover:border-hesya-amber-500 disabled:opacity-50"
                  >
                    {labels.editButton}
                  </button>
                )}
              </div>

              {editing ? (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-hesya-navy-900/70">
                      {labels.columnAllergyNote}
                    </label>
                    <input
                      type="text"
                      value={allergy}
                      onChange={(e) => setAllergy(e.target.value)}
                      placeholder={labels.allergyPlaceholder}
                      className="w-full rounded-lg border border-hesya-peach-200 px-3 py-1.5 text-xs focus:border-hesya-navy-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-hesya-navy-900/70">
                      {labels.columnPreferredDesigner}
                    </label>
                    <input
                      type="text"
                      value={preferred}
                      onChange={(e) => setPreferred(e.target.value)}
                      placeholder={labels.preferredDesignerPlaceholder}
                      className="w-full rounded-lg border border-hesya-peach-200 px-3 py-1.5 text-xs focus:border-hesya-navy-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSave(row.id)}
                      disabled={pending}
                      className="rounded-full bg-hesya-navy-900 px-4 py-1.5 text-xs font-semibold text-hesya-peach-50 hover:bg-hesya-navy-800 disabled:opacity-60"
                    >
                      {pending ? "…" : labels.saveButton}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-full border border-hesya-peach-200 px-4 py-1.5 text-xs font-semibold text-hesya-navy-900 hover:border-hesya-amber-500"
                    >
                      {labels.cancelButton}
                    </button>
                  </div>
                </div>
              ) : row.allergyNote || row.preferredDesigner ? (
                <dl className="mt-3 space-y-1 text-[11px]">
                  {row.allergyNote && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-hesya-navy-900/55">
                        {labels.columnAllergyNote}:
                      </dt>
                      <dd className="text-hesya-navy-900">{row.allergyNote}</dd>
                    </div>
                  )}
                  {row.preferredDesigner && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-hesya-navy-900/55">
                        {labels.columnPreferredDesigner}:
                      </dt>
                      <dd className="text-hesya-navy-900">
                        {row.preferredDesigner}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
