/**
 * Sprint 2C PR-C2 — Settings 5 placeholder sections mock content.
 *
 * MOCK_FIXTURES=true 시 SettingsForm의 5 placeholder section을 풍부한 read-only
 * mock 카드로 대체. 사장에게 "완성된 운영 도구" 시연.
 *
 * 베타 매장 매칭 후 실제 editable form으로 교체 (Phase 1.5).
 */

import type {
  MockChannel,
  MockMultilingualName,
  MockNotificationChannel,
  MockPaymentMethod,
} from "@/lib/mock-fixtures/settings";

export interface MockSectionLabels {
  readonly multilingualHint: string;
  readonly multilingualAutoBadge: string;
  readonly multilingualSourceBadge: string;
  readonly channelStatusConnected: string;
  readonly channelStatusPending: string;
  readonly channelStatusNeedsBusiness: string;
  readonly bookingDepositLabel: string;
  readonly bookingCancelLabel: string;
  readonly bookingNoshowLabel: string;
  readonly bookingDepositValue: string;
  readonly bookingCancelValue: string;
  readonly bookingNoshowValue: string;
  readonly paymentsHint: string;
  readonly paymentsEnabled: string;
  readonly paymentsDisabled: string;
  readonly notificationsEnabled: string;
  readonly notificationsDisabled: string;
}

export function MultilingualMockSection({
  names,
  labels,
}: {
  names: ReadonlyArray<MockMultilingualName>;
  labels: MockSectionLabels;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-hesya-navy-900/55">
        {labels.multilingualHint}
      </p>
      <div className="space-y-2">
        {names.map((n) => (
          <div
            key={n.locale}
            className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-hesya-navy-900/5"
          >
            <span aria-hidden="true" className="text-[20px]">
              {n.flag}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-hesya-navy-900/45">
                {n.label}
              </p>
              <p className="truncate text-[13.5px] font-medium text-hesya-navy-900">
                {n.value}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                n.autoTranslated
                  ? "bg-hesya-peach-100 text-hesya-amber-600"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {n.autoTranslated
                ? labels.multilingualAutoBadge
                : labels.multilingualSourceBadge}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChannelsMockSection({
  channels,
  labels,
}: {
  channels: ReadonlyArray<MockChannel>;
  labels: MockSectionLabels;
}) {
  const statusText = (s: MockChannel["status"]) =>
    s === "connected"
      ? labels.channelStatusConnected
      : s === "pending"
        ? labels.channelStatusPending
        : labels.channelStatusNeedsBusiness;
  const statusColor = (s: MockChannel["status"]) =>
    s === "connected"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-hesya-peach-100 text-hesya-amber-600";

  return (
    <div className="space-y-2">
      {channels.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-hesya-navy-900/5"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-hesya-navy-900">
              {c.name}
            </p>
            <p className="text-[11px] text-hesya-navy-900/55">
              {statusText(c.status)}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${statusColor(c.status)}`}
          >
            {c.badge}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BookingPolicyMockSection({
  policy,
  labels,
}: {
  policy: {
    readonly depositPercent: number;
    readonly cancelHoursThreshold: number;
    readonly refundFullPercent: number;
    readonly refundHalfHoursThreshold: number;
    readonly refundHalfPercent: number;
  };
  labels: MockSectionLabels;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <PolicyCard
        title={labels.bookingDepositLabel}
        value={labels.bookingDepositValue.replace(
          "{percent}",
          String(policy.depositPercent),
        )}
      />
      <PolicyCard
        title={labels.bookingCancelLabel}
        value={labels.bookingCancelValue
          .replace("{full}", String(policy.refundFullPercent))
          .replace("{half}", String(policy.refundHalfPercent))
          .replace("{fullHours}", String(policy.cancelHoursThreshold))
          .replace("{halfHours}", String(policy.refundHalfHoursThreshold))}
      />
      <PolicyCard
        title={labels.bookingNoshowLabel}
        value={labels.bookingNoshowValue}
      />
    </div>
  );
}

function PolicyCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-hesya-navy-900/5">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-hesya-navy-900/45">
        {title}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-hesya-navy-900 [word-break:keep-all]">
        {value}
      </p>
    </div>
  );
}

export function PaymentsMockSection({
  methods,
  labels,
}: {
  methods: ReadonlyArray<MockPaymentMethod>;
  labels: MockSectionLabels;
}) {
  return (
    <div className="space-y-2.5">
      <p className="text-[12px] text-hesya-navy-900/55">
        {labels.paymentsHint}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {methods.map((m) => (
          <div
            key={m.key}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${
              m.enabled
                ? "bg-white ring-hesya-amber-600/20"
                : "bg-hesya-peach-50/50 ring-hesya-navy-900/5 opacity-60"
            }`}
          >
            <span aria-hidden="true" className="text-[22px]">
              {m.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-hesya-navy-900">
                {m.name}
              </p>
              <p className="font-mono text-[11px] text-hesya-navy-900/55">
                {m.feeNote}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                m.enabled
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-hesya-navy-900/10 text-hesya-navy-900/50"
              }`}
            >
              {m.enabled ? labels.paymentsEnabled : labels.paymentsDisabled}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationsMockSection({
  channels,
  labels,
}: {
  channels: ReadonlyArray<MockNotificationChannel>;
  labels: MockSectionLabels;
}) {
  return (
    <div className="space-y-2">
      {channels.map((c) => (
        <div
          key={c.key}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 ring-1 ${
            c.enabled
              ? "bg-white ring-hesya-amber-600/20"
              : "bg-hesya-peach-50/50 ring-hesya-navy-900/5"
          }`}
        >
          <span aria-hidden="true" className="text-[22px]">
            {c.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-hesya-navy-900">
              {c.name}
            </p>
            <p className="text-[11px] text-hesya-navy-900/55 [word-break:keep-all]">
              {c.hint}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
              c.enabled
                ? "bg-emerald-100 text-emerald-700"
                : "bg-hesya-navy-900/10 text-hesya-navy-900/50"
            }`}
          >
            {c.enabled
              ? labels.notificationsEnabled
              : labels.notificationsDisabled}
          </span>
        </div>
      ))}
    </div>
  );
}
