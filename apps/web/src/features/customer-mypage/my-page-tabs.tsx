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
      <div className="cm-tabs-bar">
        {(["upcoming", "past", "saved", "reviews"] as TabKey[]).map((k) => {
          const active = tab === k;
          // Reviews tab의 pending이 있으면 amber-600 alert.
          const alert = k === "reviews" && counts[k] > 0;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(k)}
              className={"cm-tab" + (active ? " active" : "")}
            >
              {labels.tabs[k]}
              {counts[k] > 0 && (
                <span className={"cm-tcount" + (alert ? " alert" : "")}>
                  {counts[k]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div key={tab} className="cm-tab-scroll cm-tab-pane">
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
          className="mt-6 rounded-2xl bg-hesya-peach-100 p-4"
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
              className="h-full rounded-full bg-gradient-to-r from-hesya-amber-500 to-hesya-amber-600 transition-all"
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
          className="flex gap-1.5 rounded-[10px] bg-hesya-peach-50 p-2"
        >
          {miniTimeline.map((c, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col items-center justify-center rounded-xl py-2 text-center transition ${
                c.booked
                  ? "bg-hesya-amber-500 shadow-sm"
                  : c.today
                    ? "bg-white ring-1 ring-hesya-amber-600 shadow-sm"
                    : "bg-white/60"
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
                className={`text-[9px] uppercase tracking-[0.05em] ${
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
          style={{
            ["--up-tint" as never]: pickWarmColor(b.id),
          }}
          className="rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(26,34,56,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(26,34,56,0.10)]"
        >
          <div className="cm-up-when">
            {(() => {
              const formatted = formatDateTime(b.scheduledAt, locale);
              // "Mar 14, 14:00" 형식 → 시간만 amber em 강조
              const match = formatted.match(/^(.*?)(\d{2}:\d{2})$/);
              if (match) {
                return (
                  <>
                    {match[1]}
                    <em>{match[2]}</em>
                  </>
                );
              }
              return formatted;
            })()}
          </div>
          <div className="mt-1 flex items-start gap-3">
            <div
              aria-hidden="true"
              style={{
                background: `linear-gradient(135deg, ${pickWarmColor(b.id)}, var(--hesya-amber-600))`,
              }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-heading text-[18px] font-semibold italic text-white"
            >
              {(b.storeName ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-hesya-navy-900">
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-hesya-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(232,169,122,0.35)] transition hover:bg-hesya-amber-600"
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
          <div
            aria-hidden="true"
            style={{
              background: `linear-gradient(135deg, ${pickWarmColor(b.id)}, var(--hesya-amber-600))`,
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[18px] font-semibold text-white"
          >
            {(b.storeName ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-hesya-navy-900">
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
            {/* Past stars — DAL rating 컬럼 미존재. id hash 기반 4~5 stars mock. */}
            <div className="cm-past-stars" aria-label="rating">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={
                    "cm-ps" + (i <= pastRatingFromId(b.id) ? " on" : "")
                  }
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          {b.storeId && (
            <a
              href={`/${locale}/c/store/${b.storeId}/book/schedule`}
              className="cm-ghost-btn"
            >
              {labels.actions.bookAgain}
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

/**
 * Past 카드 별점 mock — reference rating: 4 또는 5. DAL `bookings.rating` 도입
 * 전 임시: bookingId 마지막 글자 ASCII가 짝수면 5, 홀수면 4.
 * 후속 task: bookings 테이블에 rating 컬럼 추가 + CustomerBookingRow 확장.
 */
function pastRatingFromId(id: string): 4 | 5 {
  const last = id.charCodeAt(id.length - 1);
  return last % 2 === 0 ? 5 : 4;
}

/**
 * 카드 개성 색 cycling — reference mypage-app.jsx의 booking/store별 다른 warm
 * color (peach / trust-rose / sage / cool-blue). booking.color 컬럼 도입 전 mock.
 */
const WARM_PALETTE = ["#F5DDC8", "#E8C4D6", "#D6E8C9", "#C9D6E8"] as const;
function pickWarmColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return WARM_PALETTE[Math.abs(h) % WARM_PALETTE.length] ?? WARM_PALETTE[0]!;
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
    <div className="cm-saved-grid">
      {rows.map((s) => {
        // SavedStoreRow는 현재 storeId/storeName/category만 노출. rating/price/area
        // 컬럼 DAL 도입은 별도 task (reviews avg + services range 집계 필요). reference
        // visual parity 위해 id hash 기반 mock 값 사용.
        const { rating, price, area } = savedMockMeta(s);
        return (
          <a
            key={s.storeId}
            href={`/${locale}/c/store/${s.storeId}`}
            className="cm-saved-card"
            aria-label={s.storeName ?? "store"}
          >
            <div
              className="cm-saved-img"
              style={{
                background: `linear-gradient(135deg, ${pickWarmColor(s.storeId)}, var(--hesya-amber-600))`,
              }}
            >
              <UnsaveHeart
                storeId={s.storeId}
                locale={locale}
                label={labels.actions.unsave}
              />
            </div>
            <div className="cm-saved-body">
              <div className="cm-saved-name">{s.storeName ?? "—"}</div>
              <div className="cm-saved-area">{area}</div>
              <div className="cm-saved-meta">
                <span className="cm-saved-rating">★ {rating}</span>
                <span className="cm-saved-price">{price}</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/**
 * Saved 카드 visual mock — DAL 확장(rating avg + services minPrice + category)
 * 도입 전 임시. reference parity 목적 (Jayden A2 정책 — mock data를 reference와 동일).
 */
function savedMockMeta(s: SavedStoreRow): {
  rating: string;
  price: string;
  area: string;
} {
  const seed =
    s.storeId.charCodeAt(0) + s.storeId.charCodeAt(s.storeId.length - 1);
  const ratings = ["4.7", "4.8", "4.85", "4.9", "4.95"];
  const prices = ["₩68k", "₩85k", "₩95k", "₩105k", "₩120k", "₩140k"];
  const areas = ["Hair", "Makeup", "Nail", "Color", "Salon"];
  const rating = ratings[seed % ratings.length]!;
  const price = prices[seed % prices.length]!;
  const area = areas[seed % areas.length]!;
  return { rating, price, area };
}

function UnsaveHeart({
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
      onClick={async (e) => {
        // Saved card 전체가 link라 click bubbling 차단.
        e.preventDefault();
        e.stopPropagation();
        const res = await unsaveStoreAction({ storeId, locale });
        if (!res.ok) {
          alert(res.message);
        }
      }}
      className="cm-heart"
      aria-label={label}
    >
      ♥
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
      <div className="flex items-center gap-2 rounded-2xl bg-hesya-peach-50 px-4 py-2.5 ring-1 ring-hesya-peach-100">
        <span className="rounded-full bg-hesya-amber-500 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-white">
          {rows.length}
        </span>
        <span className="kr text-[12.5px] font-semibold text-hesya-navy-900">
          {labels.tabs.reviews}
        </span>
        <span aria-hidden="true" className="text-hesya-navy-900/25">
          ·
        </span>
        <span className="kr text-[11.5px] text-hesya-navy-900/65 [word-break:keep-all]">
          🌐 {labels.review.languageNote}
        </span>
      </div>
      {rows.map((r) => (
        <ReviewCard key={r.bookingId} row={r} labels={labels} locale={locale} />
      ))}
      <div className="cm-rv-skip">
        <button type="button">{labels.review.skipAll}</button>
      </div>
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
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          style={{
            background: `linear-gradient(135deg, ${pickWarmColor(row.bookingId)}, var(--hesya-amber-600))`,
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[16px] font-semibold text-white"
        >
          {(row.storeName ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-hesya-navy-900 [word-break:keep-all]">
            {labels.review.question.split("{store}").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <em className="not-italic text-hesya-amber-600">
                    {row.storeName ?? "—"}
                  </em>
                )}
              </span>
            ))}
          </div>
          <div className="mt-0.5 text-[11px] text-hesya-navy-900/55">
            {row.serviceName ?? "—"}
          </div>
        </div>
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
        {stars > 0 && (
          <span className="ml-2 font-mono text-[11px] font-semibold text-hesya-amber-600 tabular-nums">
            {stars}/5
          </span>
        )}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={labels.review.placeholder}
        rows={3}
        className="cm-rv-textarea mt-3"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="cm-rv-note">🌐 {labels.review.languageNote}</p>
        <div className="flex items-center gap-2">
          {content.trim().length > 0 && (
            <span
              className={[
                "font-mono text-[10.5px] tabular-nums transition-colors",
                content.trim().length >= 2
                  ? "text-hesya-navy-900/55"
                  : "text-hesya-navy-900/35",
              ].join(" ")}
            >
              {content.trim().length}
            </span>
          )}
          <button
            type="button"
            disabled={submitting || stars < 1 || content.trim().length < 2}
            onClick={handleSubmit}
            className={
              stars < 1 || content.trim().length < 2
                ? "rounded-full bg-hesya-navy-900/15 px-4 py-1.5 text-[12px] font-semibold text-hesya-navy-900/40 cursor-not-allowed"
                : "rounded-full bg-hesya-amber-500 px-4 py-1.5 text-[12px] font-semibold text-white shadow-[0_4px_10px_rgba(232,169,122,0.35)] transition hover:bg-hesya-amber-600 disabled:opacity-50"
            }
          >
            {submitting ? "…" : labels.review.submit}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-[11px] text-rose-700" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
