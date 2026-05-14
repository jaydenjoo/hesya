"use client";

/**
 * Sprint 2C PR-C4 — Owner /store/photos 페이지 메인 클라이언트 컴포넌트.
 *
 * Reference: docs/design/reference/store-photos.jsx.
 * Filter chip 상태 + 선택 photo 상태 client side. 데이터는 props로 받음 (mock).
 */

import { useMemo, useState } from "react";

import { STYLIST_COLORS, type MockPhoto } from "@/lib/mock-fixtures/photos";

type FilterId = "latest" | "failed" | "vip";

export interface PhotoBoardLabels {
  readonly filterLatest: string;
  readonly filterFailed: string;
  readonly filterVip: string;
  readonly gridCount: string;
  readonly avgConfidence: string;
  readonly toggleGrid: string;
  readonly toggleList: string;
  readonly statusBooked: string;
  readonly statusReview: string;
  readonly statusFailed: string;
  readonly photoLabel: string;
  readonly photoMeta: string;
  readonly scoreLabel: string;
  readonly auditTitle: string;
  readonly auditTag: string;
  readonly auditThicknessLabel: string;
  readonly auditThicknessVal: string;
  readonly auditTechLabel: string;
  readonly auditTechSub: string;
  readonly auditPortfolioLabel: string;
  readonly auditPortfolioSub: string;
  readonly failedHeading: string;
  readonly failedBody: string;
  readonly failedPhotoQuality: string;
  readonly failedRequestMatch: string;
  readonly failedStylistMatch: string;
  readonly close: string;
  readonly noStylist: string;
  readonly designerSuffix: string;
}

export function PhotoBoard({
  photos,
  labels,
  counts,
}: {
  photos: ReadonlyArray<MockPhoto>;
  labels: PhotoBoardLabels;
  counts: {
    latest: number;
    failed: number;
    vip: number;
    avgConfidence: number;
  };
}) {
  const [filter, setFilter] = useState<FilterId>("latest");
  const [selectedId, setSelectedId] = useState<number>(photos[0]?.id ?? 0);

  const filtered = useMemo(() => {
    if (filter === "failed") return photos.filter((p) => p.status === "failed");
    if (filter === "vip") return photos.filter((p) => p.vip);
    return photos;
  }, [filter, photos]);

  const selected = useMemo(
    () => photos.find((p) => p.id === selectedId) ?? photos[0] ?? null,
    [photos, selectedId],
  );

  const filterChips: ReadonlyArray<{
    id: FilterId;
    label: string;
    n: number;
  }> = [
    { id: "latest", label: labels.filterLatest, n: counts.latest },
    { id: "failed", label: labels.filterFailed, n: counts.failed },
    { id: "vip", label: labels.filterVip, n: counts.vip },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition ${
                filter === c.id
                  ? "border-hesya-amber-600 bg-hesya-amber-500/10 text-hesya-navy-900"
                  : "border-hesya-navy-900/12 bg-white text-hesya-navy-900/70 hover:border-hesya-navy-900/30"
              }`}
            >
              <span>{c.label}</span>
              <span className="font-mono text-[10.5px] text-hesya-navy-900/55">
                {c.n}
              </span>
            </button>
          ))}
        </div>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-hesya-navy-900/50">
          {filtered.length}
          {labels.gridCount} · {labels.avgConfidence}{" "}
          <strong className="text-hesya-navy-900/75">
            {counts.avgConfidence}
          </strong>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <PhotoGrid
          photos={filtered}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          labels={labels}
        />
        {selected && (
          <PhotoDetailPanel
            photo={selected}
            labels={labels}
            onClose={() => undefined}
          />
        )}
      </div>
    </>
  );
}

function PhotoGrid({
  photos,
  selectedId,
  onSelect,
  labels,
}: {
  photos: ReadonlyArray<MockPhoto>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  labels: PhotoBoardLabels;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((p) => (
        <PhotoTile
          key={p.id}
          photo={p}
          selected={p.id === selectedId}
          onClick={() => onSelect(p.id)}
          labels={labels}
        />
      ))}
    </div>
  );
}

function PhotoTile({
  photo,
  selected,
  onClick,
  labels,
}: {
  photo: MockPhoto;
  selected: boolean;
  onClick: () => void;
  labels: PhotoBoardLabels;
}) {
  const stylistColor = photo.stylistInitial
    ? (STYLIST_COLORS[photo.stylistInitial] ?? "#1A2238")
    : "rgba(26,34,56,0.2)";

  const photoBg =
    photo.status === "failed"
      ? `linear-gradient(${135 + photo.id * 30}deg, #E5E5E5, #D4D4D4)`
      : `linear-gradient(${135 + photo.id * 30}deg, #FDE4D0, #E8A97A)`;

  const statusLabel =
    photo.status === "booked"
      ? labels.statusBooked
      : photo.status === "review"
        ? labels.statusReview
        : labels.statusFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`photo-tile-${photo.id}`}
      className={`group relative overflow-hidden rounded-xl bg-white text-left ring-1 transition ${
        selected
          ? "ring-2 ring-hesya-amber-600"
          : "ring-hesya-navy-900/8 hover:ring-hesya-navy-900/20"
      }`}
    >
      <div className="relative h-36 w-full" style={{ background: photoBg }}>
        <div
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-sm ring-2 ring-white/80"
          style={{ background: stylistColor }}
          title={photo.stylist ?? labels.noStylist}
        >
          {photo.stylistInitial ?? "?"}
        </div>
        {photo.vip && (
          <span className="absolute left-2 top-2 rounded-full bg-hesya-navy-900/85 px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white">
            ★ VIP
          </span>
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 font-mono text-[9.5px] text-hesya-navy-900/75 backdrop-blur-sm">
          {photo.when}
        </span>
      </div>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true">{photo.flag}</span>
          <span className="truncate text-[12px] font-semibold text-hesya-navy-900">
            {photo.customer}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
              photo.status === "booked"
                ? "bg-emerald-50 text-emerald-700"
                : photo.status === "review"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-rose-50 text-rose-700"
            }`}
          >
            {statusLabel}
          </span>
          <span
            className={`font-mono text-[11px] font-semibold ${
              photo.score >= 80
                ? "text-emerald-600"
                : photo.score >= 60
                  ? "text-amber-600"
                  : "text-rose-600"
            }`}
          >
            {photo.score}
          </span>
        </div>
      </div>
    </button>
  );
}

function PhotoDetailPanel({
  photo,
  labels,
}: {
  photo: MockPhoto;
  labels: PhotoBoardLabels;
  onClose: () => void;
}) {
  const isFailed = photo.status === "failed";
  const stylistColor = photo.stylistInitial
    ? (STYLIST_COLORS[photo.stylistInitial] ?? "#1A2238")
    : "rgba(26,34,56,0.2)";

  const photoBg = isFailed
    ? `linear-gradient(135deg, #E5E5E5, #D4D4D4)`
    : `linear-gradient(${135 + photo.id * 30}deg, #FDE4D0, #E8A97A)`;

  return (
    <aside
      data-testid="photo-detail-panel"
      className="sticky top-4 self-start rounded-2xl bg-white p-5 shadow-sm ring-1 ring-hesya-navy-900/8"
    >
      <header className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span aria-hidden="true" className="text-[20px] leading-none">
            {photo.flag}
          </span>
          <div>
            <h3 className="font-display text-[15px] font-semibold italic text-hesya-navy-900">
              {photo.customer}
            </h3>
            <p className="mt-0.5 text-[11px] text-hesya-navy-900/55">
              {photo.country} · {photo.when}
            </p>
          </div>
        </div>
      </header>

      <div
        className="relative mb-4 h-44 w-full overflow-hidden rounded-xl"
        style={{ background: photoBg }}
      >
        <div className="absolute inset-x-3 bottom-3 flex flex-col gap-0.5">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-white/90">
            {labels.photoLabel}
          </span>
          <span className="font-mono text-[9.5px] text-white/65">
            {labels.photoMeta}
          </span>
        </div>
        {!isFailed && (
          <div className="absolute right-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-hesya-navy-900/55 text-white backdrop-blur">
            <span className="font-mono text-[18px] font-semibold leading-none">
              {photo.score}
            </span>
            <span className="mt-0.5 text-[8.5px]">{labels.scoreLabel}</span>
          </div>
        )}
      </div>

      {isFailed ? (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span aria-hidden="true" className="text-[18px]">
              ⚠
            </span>
            <h4 className="font-display text-[14px] font-semibold italic text-hesya-navy-900">
              {labels.failedHeading}
            </h4>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-hesya-navy-900/65 [word-break:keep-all]">
            {labels.failedBody}
          </p>
          <div className="space-y-2">
            <FailRow
              label={labels.failedPhotoQuality}
              value={32}
              tone="danger"
            />
            <FailRow label={labels.failedRequestMatch} value={44} tone="warn" />
            <FailRow
              label={labels.failedStylistMatch}
              value={16}
              tone="danger"
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h4 className="font-display text-[14px] font-semibold italic text-hesya-navy-900">
              {labels.auditTitle}
            </h4>
            <span className="rounded-full bg-hesya-peach-50 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-hesya-amber-600">
              {labels.auditTag}
            </span>
          </div>

          <ol className="space-y-3">
            <li className="flex gap-2.5">
              <span className="font-mono text-[10px] font-semibold text-hesya-amber-600">
                01
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-hesya-navy-900">
                  {labels.auditThicknessLabel}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-hesya-navy-900/70">
                    {labels.auditThicknessVal}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-hesya-peach-50">
                    <div
                      className="absolute inset-y-0 left-0 bg-hesya-amber-500"
                      style={{ width: `${(photo.thickness ?? 0) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-hesya-navy-900/55">
                    {photo.thickness?.toFixed(2)}
                  </span>
                </div>
              </div>
            </li>

            <li className="flex gap-2.5">
              <span className="font-mono text-[10px] font-semibold text-hesya-amber-600">
                02
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-hesya-navy-900">
                  {labels.auditTechLabel}
                </p>
                <p className="mt-1 text-[11.5px] text-hesya-navy-900">
                  {photo.technique}
                </p>
                <p className="mt-0.5 text-[10.5px] text-hesya-navy-900/45">
                  {labels.auditTechSub}
                </p>
              </div>
            </li>

            <li className="flex gap-2.5">
              <span className="font-mono text-[10px] font-semibold text-hesya-amber-600">
                03
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-hesya-navy-900">
                  {labels.auditPortfolioLabel}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className="inline-flex items-center gap-1 font-display text-[13px] font-semibold italic"
                    style={{ color: stylistColor }}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: stylistColor }}
                    />
                    {photo.stylist}
                    {labels.designerSuffix}
                  </span>
                  <span className="text-[10.5px] text-hesya-navy-900/55">
                    {labels.auditPortfolioSub} {photo.portfolio}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-6 gap-1">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded"
                      style={{
                        background: `linear-gradient(${135 + (photo.id + i) * 30}deg, #FDE4D0, #E8A97A)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </li>
          </ol>
        </div>
      )}
    </aside>
  );
}

function FailRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warn";
}) {
  const barColor = tone === "danger" ? "#E11D48" : "#F59E0B";
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-24 shrink-0 text-hesya-navy-900/70">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-hesya-peach-50">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${value}%`, background: barColor }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[10px] text-hesya-navy-900/55">
        {value}
      </span>
    </div>
  );
}
