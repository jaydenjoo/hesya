import { describe, it, expect, vi } from "vitest";
import * as helpers from "./db";
import type { DbClient } from "@hesya/database";

describe("test-helpers/db", () => {
  it("exports seedStoreIntegration function", () => {
    expect(typeof helpers.seedStoreIntegration).toBe("function");
  });

  it("seedStoreIntegration calls db.insert with provided storeId/channel/externalAccountId", async () => {
    // seedStoreIntegration은 db.insert(table).values(row)만 사용 (.returning() 호출 X).
    // mock chain은 실제 함수의 awaitable 결과를 정확히 흉내냄.
    const valuesSpy = vi.fn(() => Promise.resolve());
    const insertSpy = vi.fn(() => ({ values: valuesSpy }));
    const fakeDb = { insert: insertSpy } as unknown as DbClient;

    await helpers.seedStoreIntegration(fakeDb, {
      storeId: "s_1",
      channel: "instagram",
      externalAccountId: "ig_acc_1",
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: "s_1",
        channel: "instagram",
        externalAccountId: "ig_acc_1",
      }),
    );
  });
});
