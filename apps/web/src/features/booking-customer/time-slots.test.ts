import { describe, it, expect } from "vitest";
import {
  buildDateOptions,
  buildTimeSlots,
  combineToIso,
  dayKeyFromIsoDate,
  hoursForDate,
} from "./time-slots";

describe("booking-customer/time-slots", () => {
  describe("buildTimeSlots", () => {
    it("기본 — 10:00~19:30 30분 단위로 20개 슬롯", () => {
      const slots = buildTimeSlots();
      expect(slots).toHaveLength(20);
      expect(slots[0]?.value).toBe("10:00");
      expect(slots[1]?.value).toBe("10:30");
      expect(slots[slots.length - 1]?.value).toBe("19:30");
    });

    it("dynamic — 매장 hours 09:00~18:00 → 18개 슬롯 (마지막 17:30)", () => {
      // 2026-05-12 = 화요일
      const slots = buildTimeSlots("2026-05-12", {
        tue: { open: "09:00", close: "18:00" },
      });
      expect(slots[0]?.value).toBe("09:00");
      expect(slots[slots.length - 1]?.value).toBe("17:30");
      expect(slots.length).toBe(18);
    });

    it("dynamic — 휴무일 (null) → 빈 배열", () => {
      const slots = buildTimeSlots("2026-05-12", {
        tue: null,
      });
      expect(slots).toEqual([]);
    });

    it("dynamic — 누락 요일 → 기본값 fallback (10:00~19:30)", () => {
      // 2026-05-12는 tue라 mon 누락 시 fallback
      const slots = buildTimeSlots("2026-05-12", {
        mon: { open: "11:00", close: "21:00" },
      });
      expect(slots[0]?.value).toBe("10:00");
      expect(slots[slots.length - 1]?.value).toBe("19:30");
    });
  });

  describe("buildDateOptions", () => {
    it("rangeDays=3 → 3개 option, 첫 항목 isToday=true", () => {
      // 2026-05-12 12:00 Asia/Seoul → 03:00 UTC.
      const now = new Date("2026-05-12T03:00:00Z");
      const options = buildDateOptions(3, "ko", now);
      expect(options).toHaveLength(3);
      expect(options[0]?.isToday).toBe(true);
      expect(options[1]?.isTomorrow).toBe(true);
      expect(options[2]?.isToday).toBe(false);
      expect(options[0]?.value).toBe("2026-05-12");
      expect(options[1]?.value).toBe("2026-05-13");
    });

    it("businessHours에 휴무일 명시 → isClosed:true", () => {
      const now = new Date("2026-05-12T03:00:00Z");
      // 2026-05-12 = tue, 2026-05-13 = wed
      const options = buildDateOptions(3, "ko", now, {
        tue: null,
        wed: { open: "10:00", close: "20:00" },
      });
      expect(options[0]?.isClosed).toBe(true);
      expect(options[1]?.isClosed).toBe(false);
    });

    it("businessHours 미전달 → 모든 day isClosed:false (기본값 적용)", () => {
      const now = new Date("2026-05-12T03:00:00Z");
      const options = buildDateOptions(3, "ko", now);
      expect(options.every((o) => !o.isClosed)).toBe(true);
    });
  });

  describe("dayKeyFromIsoDate", () => {
    it("KST 기준 요일 정확히 반환 — 2026-05-12 = 화요일", () => {
      expect(dayKeyFromIsoDate("2026-05-12")).toBe("tue");
    });

    it("일요일 케이스 — 2026-05-10", () => {
      expect(dayKeyFromIsoDate("2026-05-10")).toBe("sun");
    });
  });

  describe("hoursForDate", () => {
    it("businessHours null → 기본값 10:00~20:00", () => {
      expect(hoursForDate(null, "2026-05-12")).toEqual({
        open: "10:00",
        close: "20:00",
      });
    });

    it("요일 휴무 → null", () => {
      expect(hoursForDate({ tue: null }, "2026-05-12")).toBeNull();
    });

    it("요일 영업 → open/close 그대로", () => {
      expect(
        hoursForDate({ tue: { open: "11:00", close: "21:00" } }, "2026-05-12"),
      ).toEqual({ open: "11:00", close: "21:00" });
    });
  });

  describe("combineToIso", () => {
    it("YYYY-MM-DD + HH:mm → +09:00 ISO", () => {
      expect(combineToIso("2026-05-12", "14:30")).toBe(
        "2026-05-12T14:30:00+09:00",
      );
    });
  });
});
