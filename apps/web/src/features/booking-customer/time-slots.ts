/**
 * Plan v3 M2.3 + M3.3b — customer-side 예약 시간 슬롯 생성.
 *
 * 매장별 `stores.business_hours`를 기반으로 요일별 open/close 동적 적용.
 * null/누락 요일 = 기본값 (10:00~20:00) fallback. null 명시 = 휴무.
 *
 * 휴무일·conflict 체크는 M2.6 server action에서 atomic 처리 (race-safe).
 * 본 util은 UI grid 생성만 담당.
 */

export interface DateOption {
  /** YYYY-MM-DD (Asia/Seoul 기준 — URL search param에 그대로 사용) */
  readonly value: string;
  /** 표시 라벨 (예: "5월 12일 (월)") */
  readonly displayLabel: string;
  /** 오늘이면 true */
  readonly isToday: boolean;
  /** 내일이면 true */
  readonly isTomorrow: boolean;
  /** 매장 휴무일이면 true (businessHours[day] === null) */
  readonly isClosed: boolean;
}

export interface TimeSlot {
  /** "HH:mm" (24h, Asia/Seoul 기준) */
  readonly value: string;
}

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type BusinessHoursInput = Partial<
  Record<DayKey, { open: string; close: string } | null>
> | null;

const DEFAULT_OPEN_HOUR = 10;
const DEFAULT_CLOSE_HOUR = 20;
const SLOT_INTERVAL_MINUTES = 30;
const SEOUL_TZ = "Asia/Seoul";

const DEFAULT_OPEN = `${String(DEFAULT_OPEN_HOUR).padStart(2, "0")}:00`;
const DEFAULT_CLOSE = `${String(DEFAULT_CLOSE_HOUR).padStart(2, "0")}:00`;

/**
 * Asia/Seoul 기준 ISO 날짜 (YYYY-MM-DD) → 요일 key.
 *
 * UTC 기반 Date.getUTCDay()는 KST와 다를 수 있어 Intl.DateTimeFormat의
 * weekday 토큰을 사용. KST 자정 경계에서 안전.
 */
export function dayKeyFromIsoDate(iso: string): DayKey {
  // KST 12:00 정오 anchor — DST 없는 KST에서 동일 날짜 보장.
  const anchor = new Date(`${iso}T12:00:00+09:00`);
  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: SEOUL_TZ,
    weekday: "short",
  }).format(anchor);
  const map: Record<string, DayKey> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  return map[dayName] ?? "mon";
}

/**
 * 주어진 ISO 날짜 + businessHours에서 해당 일의 hours 반환.
 * - null: 매장 휴무
 * - { open, close }: 영업
 *
 * 누락 또는 undefined = 기본값 10:00~20:00 fallback.
 */
export function hoursForDate(
  businessHours: BusinessHoursInput,
  iso: string,
): { open: string; close: string } | null {
  if (!businessHours) {
    return { open: DEFAULT_OPEN, close: DEFAULT_CLOSE };
  }
  const day = dayKeyFromIsoDate(iso);
  const v = businessHours[day];
  if (v === null) return null;
  if (v === undefined) {
    return { open: DEFAULT_OPEN, close: DEFAULT_CLOSE };
  }
  return v;
}

/**
 * 오늘부터 N일 동안의 날짜 option 생성. Asia/Seoul 기준 자정 경계.
 * businessHours 전달 시 휴무일은 `isClosed: true` 표시.
 */
export function buildDateOptions(
  rangeDays: number,
  locale: string,
  now: Date = new Date(),
  businessHours: BusinessHoursInput = null,
): DateOption[] {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: SEOUL_TZ,
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const isoFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayIso = isoFormatter.format(now);

  const options: DateOption[] = [];
  for (let i = 0; i < rangeDays; i += 1) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const iso = isoFormatter.format(d);
    const hours = hoursForDate(businessHours, iso);
    options.push({
      value: iso,
      displayLabel: formatter.format(d),
      isToday: iso === todayIso,
      isTomorrow: i === 1,
      isClosed: hours === null,
    });
  }
  return options;
}

function parseHM(s: string): { h: number; m: number } | null {
  const m = /^([0-9]{1,2}):([0-9]{2})$/.exec(s);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { h: hh, m: mm };
}

/**
 * 30분 단위 시간 슬롯 생성. open~close 범위 내, close 직전 슬롯까지.
 *
 * `iso` + `businessHours` 전달 시 해당 날짜의 hours 동적 적용. 휴무일이면
 * 빈 배열. 그 외 (또는 인자 미전달) 시 10:00~19:30 (DEFAULT_OPEN~CLOSE-30).
 */
export function buildTimeSlots(
  iso?: string,
  businessHours: BusinessHoursInput = null,
): TimeSlot[] {
  let openH = DEFAULT_OPEN_HOUR;
  let openM = 0;
  let closeH = DEFAULT_CLOSE_HOUR;
  let closeM = 0;

  if (iso) {
    const hours = hoursForDate(businessHours, iso);
    if (hours === null) return [];
    const op = parseHM(hours.open);
    const cl = parseHM(hours.close);
    if (op && cl) {
      openH = op.h;
      openM = op.m;
      closeH = cl.h;
      closeM = cl.m;
    }
  }

  const slots: TimeSlot[] = [];
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;
  for (let t = openTotal; t < closeTotal; t += SLOT_INTERVAL_MINUTES) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    slots.push({ value: `${hh}:${mm}` });
  }
  return slots;
}

/**
 * date(YYYY-MM-DD) + time(HH:mm) → ISO timestamp (UTC 기준).
 *
 * Asia/Seoul 영업시간을 UTC로 변환. KST = UTC+9 고정 (DST 없음).
 */
export function combineToIso(date: string, time: string): string {
  const [hh, mm] = time.split(":");
  // Seoul 09:00 KST = 00:00 UTC. UTC offset 고정 +09:00.
  return `${date}T${hh}:${mm}:00+09:00`;
}
