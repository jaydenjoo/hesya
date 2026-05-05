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

  it("exports seedConversation function", () => {
    expect(typeof helpers.seedConversation).toBe("function");
  });

  it("seedConversation calls db.insert(conversations).values + .returning({id})", async () => {
    const returningSpy = vi.fn(() => Promise.resolve([{ id: "conv_1" }]));
    const valuesSpy = vi.fn(() => ({ returning: returningSpy }));
    const insertSpy = vi.fn(() => ({ values: valuesSpy }));
    const fakeDb = { insert: insertSpy } as unknown as DbClient;

    const id = await helpers.seedConversation(fakeDb, {
      storeId: "s_1",
      customerId: "cust_1",
      channel: "instagram",
    });

    expect(id).toBe("conv_1");
    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: "s_1",
        customerId: "cust_1",
        channel: "instagram",
        status: "open",
      }),
    );
  });

  it("exports seedMessage function", () => {
    expect(typeof helpers.seedMessage).toBe("function");
  });

  it("seedMessage calls db.insert(messages).values + .returning({id}) with default channel/status", async () => {
    const returningSpy = vi.fn(() => Promise.resolve([{ id: "msg_1" }]));
    const valuesSpy = vi.fn(() => ({ returning: returningSpy }));
    const insertSpy = vi.fn(() => ({ values: valuesSpy }));
    const fakeDb = { insert: insertSpy } as unknown as DbClient;

    const id = await helpers.seedMessage(fakeDb, {
      conversationId: "conv_1",
      direction: "inbound",
      text: "안녕",
    });

    expect(id).toBe("msg_1");
    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "conv_1",
        direction: "inbound",
        originalText: "안녕",
        channel: "instagram",
        status: "delivered",
      }),
    );
  });
});
