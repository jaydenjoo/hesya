import { describe, it, expect, vi } from "vitest";
import * as helpers from "./db";
import {
  messages,
  conversations,
  storeIntegrations,
  storeKnowledge,
  storeOwners,
  customers,
  stores,
  type DbClient,
} from "@hesya/database";

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

  it("seedMessage forwards customerId when provided (production webhook path 일관성)", async () => {
    const returningSpy = vi.fn(() => Promise.resolve([{ id: "msg_2" }]));
    const valuesSpy = vi.fn(() => ({ returning: returningSpy }));
    const insertSpy = vi.fn(() => ({ values: valuesSpy }));
    const fakeDb = { insert: insertSpy } as unknown as DbClient;

    await helpers.seedMessage(fakeDb, {
      conversationId: "conv_1",
      customerId: "cust_42",
      direction: "inbound",
      text: "Hello",
    });

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cust_42" }),
    );
  });

  it("seedMessage forwards storeId when provided (RAG 검색 storeId 의존)", async () => {
    const returningSpy = vi.fn(() => Promise.resolve([{ id: "msg_3" }]));
    const valuesSpy = vi.fn(() => ({ returning: returningSpy }));
    const insertSpy = vi.fn(() => ({ values: valuesSpy }));
    const fakeDb = { insert: insertSpy } as unknown as DbClient;

    await helpers.seedMessage(fakeDb, {
      conversationId: "conv_1",
      storeId: "store_99",
      direction: "inbound",
      text: "Hi",
    });

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: "store_99" }),
    );
  });

  it("seedUser id override → 명시 id로 INSERT 가능 (E2E_AUTH_USER_ID 동기화용)", async () => {
    const returningSpy = vi.fn(() => Promise.resolve([{ id: "fixed_id" }]));
    const valuesSpy = vi.fn(() => ({ returning: returningSpy }));
    const insertSpy = vi.fn(() => ({ values: valuesSpy }));
    const fakeDb = { insert: insertSpy } as unknown as DbClient;

    await helpers.seedUser(fakeDb, { id: "fixed_id" });

    expect(valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: "fixed_id" }),
    );
  });

  it("seedUser id override 미명시 → values에 id 키 없음 (schema defaultRandom 작동)", async () => {
    const returningSpy = vi.fn(() => Promise.resolve([{ id: "auto_id" }]));
    const valuesSpy = vi.fn<(arg: unknown) => unknown>(() => ({
      returning: returningSpy,
    }));
    const insertSpy = vi.fn(() => ({ values: valuesSpy }));
    const fakeDb = { insert: insertSpy } as unknown as DbClient;

    await helpers.seedUser(fakeDb, {});

    expect(valuesSpy).toHaveBeenCalled();
    const arg = valuesSpy.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg).not.toHaveProperty("id");
  });

  it("resetDb deletes tables in FK-safe order (자식 → 부모)", async () => {
    // FK 의존: messages → conversations → (storeIntegrations/storeOwners/customers) → stores
    // store_owners.storeId는 NO ACTION → stores 전에 명시 delete 필수.
    // referential equality로 호출된 테이블 객체 자체를 검증 → 순서 회귀 방어.
    const calls: unknown[] = [];
    const deleteSpy = vi.fn((table: unknown) => {
      calls.push(table);
      return Promise.resolve();
    });
    const fakeDb = { delete: deleteSpy } as unknown as DbClient;

    await helpers.resetDb(fakeDb);

    expect(calls).toEqual([
      messages,
      conversations,
      storeIntegrations,
      storeKnowledge,
      storeOwners,
      customers,
      stores,
    ]);
  });
});
