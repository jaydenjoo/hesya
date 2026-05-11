import { describe, it, expect } from "vitest";
import { buildDateOptions, buildTimeSlots, combineToIso } from "./time-slots";

describe("booking-customer/time-slots", () => {
  describe("buildTimeSlots", () => {
    it("10:00~19:30 30분 단위로 20개 슬롯 (마지막은 19:30)", () => {
      const slots = buildTimeSlots();
      expect(slots).toHaveLength(20);
      expect(slots[0]?.value).toBe("10:00");
      expect(slots[1]?.value).toBe("10:30");
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
  });

  describe("combineToIso", () => {
    it("YYYY-MM-DD + HH:mm → +09:00 ISO", () => {
      expect(combineToIso("2026-05-12", "14:30")).toBe(
        "2026-05-12T14:30:00+09:00",
      );
    });
  });
});
