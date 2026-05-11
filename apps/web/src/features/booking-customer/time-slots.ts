/**
 * Plan v3 M2.3 — customer-side 예약 시간 슬롯 생성.
 *
 * 매장 영업시간 10:00~20:00 Asia/Seoul hard-code. M3.3 매장 설정 페이지에서
 * `stores.business_hours` 컬럼 도입 후 dynamic으로 교체.
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
}

export interface TimeSlot {
  /** "HH:mm" (24h, Asia/Seoul 기준) */
  readonly value: string;
}

const BUSINESS_HOUR_START = 10;
const BUSINESS_HOUR_END = 20;
const SLOT_INTERVAL_MINUTES = 30;
const SEOUL_TZ = "Asia/Seoul";

/**
 * 오늘부터 N일 동안의 날짜 option 생성. Asia/Seoul 기준 자정 경계.
 */
export function buildDateOptions(
  rangeDays: number,
  locale: string,
  now: Date = new Date(),
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
    options.push({
      value: iso,
      displayLabel: formatter.format(d),
      isToday: iso === todayIso,
      isTomorrow: i === 1,
    });
  }
  return options;
}

/**
 * 10:00~19:30 30분 grid 시간 슬롯. business end 직전 슬롯까지.
 */
export function buildTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = BUSINESS_HOUR_START; hour < BUSINESS_HOUR_END; hour += 1) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL_MINUTES) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      slots.push({ value: `${hh}:${mm}` });
    }
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
