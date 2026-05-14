"use client";

/**
 * Plan v3 M3.4 — customer MyPage 4-tab Client 컴포넌트.
 *
 * 디자인 ref `mypage-app.jsx` (Upcoming / Past / Saved / Reviews) 정합:
 *   - 상단 가로 탭 + count badge (있을 때만)
 *   - 탭 전환은 useState (URL ?tab 미사용)
 *   - 각 탭 panel은 빈 state 별도 메시지
 *
 * 보안: 데이터는 서버에서 customerId로 격리. Client는 단순 표시 + action 호출.
 */

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import type {
  CustomerBookingRow,
  PendingReviewRow,
  SavedStoreRow,
} from "@/shared/lib/dal/customer-mypage";
import { submitReviewAction, unsaveStoreAction } from "./actions";

export interface MyPageTabsLabels {
  tabs: {
    upcoming: string;
    past: string;
    saved: string;
    reviews: string;
  };
  empty: {
    upcoming: string;
    past: string;
    saved: string;
    reviews: string;
  };
  actions: {
    bookAgain: string;
    viewStore: string;
    signOut: string;
    unsave: string;
  };
  review: {
    question: string;
    placeholder: string;
    submit: string;
    languageNote: string;
    skipAll: string;
  };
  /** Sprint 2A: upcoming reference 추가 요소 (mini timeline 미만, 3 pills + reminder). 미설정 시 미렌더. */
  upcomingExtras?: {
    showQr: string;
    directions: string;
    chat: string;
    reminder: string;
    modify: string;
    cancel: string;
  };
  /** Sprint 2A: perks band — ICU `{count}`, `{percent}`, `{done}/{target}/{remaining}` 채운 후 전달. */
  perks?: {
    title: string;
    subtitle: string;
    footer: string;
  };
}

interface MiniTimelineCell {
  readonly day: string;
  readonly month: string;
  readonly today?: boolean;
  readonly booked?: boolean;
}

interface Props {
  locale: string;
  labels: MyPageTabsLabels;
  /** Sprint 2A: upcoming pane 위 5일 mini timeline. null이면 미렌더. */
  miniTimeline: ReadonlyArray<MiniTimelineCell> | null;
  /** Sprint 2A: 멤버십 perk band. null이면 미렌더. */
  perks: {
    readonly completedCount: number;
    readonly targetCount: number;
    readonly discountPercent: number;
  } | null;
  data: {
    upcoming: CustomerBookingRow[];
    past: CustomerBookingRow[];
    saved: SavedStoreRow[];
    pendingReviews: PendingReviewRow[];
  };
}

type TabKey = "upcoming" | "past" | "saved" | "reviews";

export function MyPageTabs({
  locale,
  labels,
  miniTimeline,
  perks,
  data,
}: Props) {
  const [tab, setTab] = useState<TabKey>("upcoming");

  const counts: Record<TabKey, number> = {
    upcoming: data.upcoming.length,
    past: data.past.length,
    saved: data.saved.length,
    reviews: data.pendingReviews.length,
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto rounded-full bg-white/60 p-1 ring-1 ring-hesya-navy-900/10">
        {(["upcoming", "past", "saved", "reviews"] as TabKey[]).map((k) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(k)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                active
                  ? "bg-hesya-navy-900 text-hesya-peach-50"
                  : "text-hesya-navy-900/70 hover:text-hesya-navy-900"
              }`}
            >
              {labels.tabs[k]}
              {counts[k] > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    active
                      ? "bg-hesya-peach-50/20 text-hesya-peach-50"
                      : "bg-hesya-navy-900/10 text-hesya-navy-900/60"
                  }`}
                >
                  {counts[k]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div key={tab}>
        {tab === "upcoming" && (
          <UpcomingPane
            rows={data.upcoming}
            labels={labels}
            locale={locale}
            miniTimeline={miniTimeline}
          />
        )}
        {tab === "past" && (
          <PastPane rows={data.past} labels={labels} locale={locale} />
        )}
        {tab === "saved" && (
          <SavedPane rows={data.saved} labels={labels} locale={locale} />
        )}
        {tab === "reviews" && (
          <ReviewsPane
            rows={data.pendingReviews}
            labels={labels}
            locale={locale}
          />
        )}
      </div>

      {/* Sprint 2A: 멤버십 perk band — 모든 탭 공통 footer. */}
      {perks && labels.perks && (
        <section
          data-testid="mypage-perks"
          className="mt-6 rounded-2xl bg-gradient-to-br from-hesya-peach-100 to-hesya-amber-200/40 p-4 ring-1 ring-hesya-amber-600/15"
        >
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-[28px]">
              🎉
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[15px] font-semibold italic text-hesya-navy-900">
                {labels.perks.title}
              </p>
              <p
                className="mt-0.5 text-[12px] text-hesya-navy-900/65"
                dangerouslySetInnerHTML={{ __html: labels.perks.subtitle }}
              />
            </div>
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-hesya-amber-500 transition-all"
              style={{
                width: `${(perks.completedCount / perks.targetCount) * 100}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-1">
              {Array.from({ length: perks.targetCount }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`inline-block h-2.5 w-2.5 rounded-full border-2 ${
                    i < perks.completedCount
                      ? "border-hesya-amber-500 bg-white"
                      : "border-white/80 bg-hesya-navy-900/10"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-hesya-navy-900/55">
            {labels.perks.footer}
          </p>
        </section>
      )}
    </div>
  );
}

function formatDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-white/50 px-5 py-10 text-center text-[13px] text-hesya-navy-900/55">
      {text}
    </div>
  );
}

function UpcomingPane({
  rows,
  labels,
  locale,
  miniTimeline,
}: {
  rows: CustomerBookingRow[];
  labels: MyPageTabsLabels;
  locale: string;
  miniTimeline: ReadonlyArray<MiniTimelineCell> | null;
}) {
  if (rows.length === 0) {
    return <EmptyMessage text={labels.empty.upcoming} />;
  }
  return (
    <div className="space-y-3">
      {miniTimeline && miniTimeline.length > 0 && (
        <div
          data-testid="mypage-mini-timeline"
          className="-mx-1 flex gap-1.5 px-1"
        >
          {miniTimeline.map((c, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col items-center justify-center rounded-xl py-2 text-center ring-1 transition ${
                c.booked
                  ? "bg-hesya-amber-500 ring-hesya-amber-500"
                  : c.today
                    ? "bg-white ring-hesya-amber-600 shadow-sm"
                    : "bg-white/50 ring-hesya-navy-900/5"
              }`}
            >
              <span
                className={`font-heading text-[15px] font-semibold italic ${
                  c.booked
                    ? "text-white"
                    : c.today
                      ? "text-hesya-amber-600"
                      : "text-hesya-navy-900/70"
                }`}
              >
                {c.day}
              </span>
              <span
                className={`text-[9px] uppercase tracking-[0.12em] ${
                  c.booked ? "text-white/80" : "text-hesya-navy-900/45"
                }`}
              >
                {c.month}
              </span>
            </div>
          ))}
        </div>
      )}
      {rows.map((b) => (
        <article
          key={b.id}
          className="rounded-2xl bg-white p-4 ring-1 ring-hesya-navy-900/10"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wide text-hesya-amber-600">
            {formatDateTime(b.scheduledAt, locale)}
          </div>
          <div className="mt-1 flex items-start gap-3">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hesya-amber-200 to-hesya-amber-600 font-heading text-[18px] font-semibold italic text-white"
            >
              {(b.storeName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-heading text-[17px] font-semibold italic text-hesya-navy-900">
                {b.storeName ?? "—"}
              </div>
              <div className="text-[12px] text-hesya-navy-900/65">
                {b.serviceName ?? "—"}
              </div>
              {b.staffName && (
                <div className="mt-0.5 text-[11px] text-hesya-navy-900/55">
                  w/ {b.staffName}
                </div>
              )}
            </div>
          </div>
          {labels.upcomingExtras && (
            <>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-hesya-navy-900 px-3 py-1.5 text-[11px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90"
                >
                  <span aria-hidden="true">📱</span>
                  {labels.upcomingExtras.showQr}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-hesya-navy-900 ring-1 ring-hesya-navy-900/10 transition hover:bg-hesya-peach-100"
                >
                  <span aria-hidden="true">📍</span>
                  {labels.upcomingExtras.directions}
                </button>
                <Link
                  href={`/${locale}/c/chat`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-hesya-navy-900 ring-1 ring-hesya-navy-900/10 transition hover:bg-hesya-peach-100"
                >
                  <span aria-hidden="true">💬</span>
                  {labels.upcomingExtras.chat}
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-hesya-navy-900/45">
                <button type="button" className="hover:underline">
                  {labels.upcomingExtras.modify}
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" className="hover:underline">
                  {labels.upcomingExtras.cancel}
                </button>
              </div>
            </>
          )}
        </article>
      ))}
      {labels.upcomingExtras && (
        <div
          data-testid="mypage-reminder"
          className="flex items-center gap-2 rounded-2xl bg-hesya-peach-100/70 px-4 py-3 text-[12px] text-hesya-navy-900/75"
        >
          <span aria-hidden="true" className="text-[16px]">
            🔔
          </span>
          <span
            dangerouslySetInnerHTML={{ __html: labels.upcomingExtras.reminder }}
          />
        </div>
      )}
    </div>
  );
}

function PastPane({
  rows,
  labels,
  locale,
}: {
  rows: CustomerBookingRow[];
  labels: MyPageTabsLabels;
  locale: string;
}) {
  if (rows.length === 0) {
    return <EmptyMessage text={labels.empty.past} />;
  }
  return (
    <div className="space-y-3">
      {rows.map((b) => (
        <article
          key={b.id}
          className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-hesya-navy-900/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-hesya-amber-200 to-hesya-amber-600 text-[18px] font-semibold text-hesya-navy-900">
            {(b.storeName ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-heading text-[15px] font-semibold italic text-hesya-navy-900">
              {b.storeName ?? "—"}
            </div>
            <div className="truncate text-[12px] text-hesya-navy-900/65">
              {b.serviceName ?? "—"}
            </div>
            <div className="mt-0.5 text-[11px] text-hesya-navy-900/45">
              {formatDateTime(b.scheduledAt, locale)} ·{" "}
              {b.totalPriceKrw != null
                ? `₩${b.totalPriceKrw.toLocaleString("ko")}`
                : "—"}
            </div>
          </div>
          {b.storeId && (
            <a
              href={`/${locale}/c/store/${b.storeId}/book/schedule`}
              className="shrink-0 rounded-full bg-hesya-navy-900/5 px-3 py-1.5 text-[11px] font-medium text-hesya-navy-900 hover:bg-hesya-navy-900/10"
            >
              {labels.actions.bookAgain}
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

function SavedPane({
  rows,
  labels,
  locale,
}: {
  rows: SavedStoreRow[];
  labels: MyPageTabsLabels;
  locale: string;
}) {
  if (rows.length === 0) {
    return <EmptyMessage text={labels.empty.saved} />;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((s) => (
        <article
          key={s.storeId}
          className="overflow-hidden rounded-2xl bg-white ring-1 ring-hesya-navy-900/10"
        >
          <a
            href={`/${locale}/c/store/${s.storeId}`}
            className="block aspect-[4/3] bg-gradient-to-br from-hesya-amber-200 to-hesya-amber-600"
            aria-label={s.storeName ?? "store"}
          />
          <div className="p-3">
            <div className="truncate text-[13px] font-semibold text-hesya-navy-900">
              {s.storeName ?? "—"}
            </div>
            <div className="mt-2">
              <UnsaveButton
                storeId={s.storeId}
                locale={locale}
                label={labels.actions.unsave}
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function UnsaveButton({
  storeId,
  locale,
  label,
}: {
  storeId: string;
  locale: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        const res = await unsaveStoreAction({ storeId, locale });
        if (!res.ok) {
          alert(res.message);
        }
      }}
      className="w-full rounded-full bg-hesya-navy-900/5 px-3 py-1.5 text-[11px] font-medium text-hesya-navy-900 hover:bg-hesya-navy-900/10"
    >
      {label}
    </button>
  );
}

function ReviewsPane({
  rows,
  labels,
  locale,
}: {
  rows: PendingReviewRow[];
  labels: MyPageTabsLabels;
  locale: string;
}) {
  if (rows.length === 0) {
    return <EmptyMessage text={labels.empty.reviews} />;
  }
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <ReviewCard key={r.bookingId} row={r} labels={labels} locale={locale} />
      ))}
    </div>
  );
}

function ReviewCard({
  row,
  labels,
  locale,
}: {
  row: PendingReviewRow;
  labels: MyPageTabsLabels;
  locale: string;
}) {
  const [stars, setStars] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-4 text-center text-[13px] text-emerald-800 ring-1 ring-emerald-200">
        ✓ {labels.review.submit}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!row.storeId) {
      setError(labels.review.languageNote);
      return;
    }
    if (stars < 1 || content.trim().length < 2) return;
    setSubmitting(true);
    setError(null);
    const res = await submitReviewAction({
      bookingId: row.bookingId,
      storeId: row.storeId,
      rating: stars,
      content: content.trim(),
      language: locale,
      locale,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setDone(true);
  };

  return (
    <article className="rounded-2xl bg-white p-4 ring-1 ring-hesya-navy-900/10">
      <div className="font-heading text-[15px] font-semibold italic text-hesya-navy-900">
        {labels.review.question.replace("{store}", row.storeName ?? "—")}
      </div>
      <div className="mt-0.5 text-[11px] text-hesya-navy-900/55">
        {row.serviceName ?? "—"}
      </div>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStars(i)}
            aria-label={`${i} star`}
            className="p-0.5"
          >
            <Star
              size={22}
              className={
                i <= stars
                  ? "fill-hesya-amber-600 text-hesya-amber-600"
                  : "text-hesya-navy-900/20"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={labels.review.placeholder}
        rows={3}
        className="mt-3 w-full rounded-xl border border-hesya-navy-900/15 bg-white/80 px-3 py-2 text-[13px] text-hesya-navy-900 placeholder:text-hesya-navy-900/40 focus:border-hesya-amber-600 focus:outline-none focus:ring-2 focus:ring-hesya-amber-600/20"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-[11px] text-hesya-navy-900/55">
          🌐 {labels.review.languageNote}
        </p>
        <button
          type="button"
          disabled={submitting || stars < 1 || content.trim().length < 2}
          onClick={handleSubmit}
          className="rounded-full bg-hesya-navy-900 px-4 py-1.5 text-[12px] font-semibold text-hesya-peach-50 disabled:opacity-50"
        >
          {submitting ? "…" : labels.review.submit}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-rose-700" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
