import { describe, it, expect } from "vitest";
import { getWindowStatus } from "./window-utils";

describe("getWindowStatus", () => {
  it("expiresAt null → no-inbound", () => {
    expect(getWindowStatus(null).state).toBe("no-inbound");
  });

  it("미래 12h+ → open", () => {
    const future = new Date(Date.now() + 12 * 60 * 60 * 1000);
    expect(getWindowStatus(future).state).toBe("open");
  });

  it("미래 30분 → closing-soon (< 1h)", () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000);
    expect(getWindowStatus(soon).state).toBe("closing-soon");
  });

  it("과거 → expired, remainingMs=0", () => {
    const past = new Date(Date.now() - 1000);
    const r = getWindowStatus(past);
    expect(r.state).toBe("expired");
    expect(r.remainingMs).toBe(0);
  });
});
