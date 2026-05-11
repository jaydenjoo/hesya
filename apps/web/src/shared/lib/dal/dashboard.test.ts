import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  conversations,
  createDbClient,
  customers,
  disputes,
  type DbClient,
} from "@hesya/database";

import { resetDb, seedStore } from "@/test-helpers/db";
import { getDisputeLoad, getInboxLoad, getKycStatus } from "./dashboard";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.dashboard (integration)", () => {
  let db: DbClient;
  let storeId: string;
  let customerId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db);
    const [c] = await db
      .insert(customers)
      .values({ preferredLanguage: "en", nationality: "JP" })
      .returning({ id: customers.id });
    customerId = c!.id;
  });

  describe("getInboxLoad", () => {
    it("0 conversations → unread/threads 0", async () => {
      const r = await getInboxLoad(db, storeId);
      expect(r).toEqual({ unreadMessages: 0, openThreads: 0 });
    });

    it("open conv 2건 (unread 3,5) → unread 8 + threads 2", async () => {
      const [c2] = await db
        .insert(customers)
        .values({ preferredLanguage: "en", nationality: "CN" })
        .returning({ id: customers.id });
      await db.insert(conversations).values([
        {
          storeId,
          customerId,
          channel: "instagram",
          status: "open",
          unreadCount: 3,
        },
        {
          storeId,
          customerId: c2!.id,
          channel: "instagram",
          status: "open",
          unreadCount: 5,
        },
      ]);
      const r = await getInboxLoad(db, storeId);
      expect(r.unreadMessages).toBe(8);
      expect(r.openThreads).toBe(2);
    });

    it("closed conversation은 카운트 제외", async () => {
      const [c2] = await db
        .insert(customers)
        .values({ preferredLanguage: "ja", nationality: "JP" })
        .returning({ id: customers.id });
      await db.insert(conversations).values([
        {
          storeId,
          customerId,
          channel: "instagram",
          status: "open",
          unreadCount: 2,
        },
        {
          storeId,
          customerId: c2!.id,
          channel: "instagram",
          status: "closed",
          unreadCount: 10,
        },
      ]);
      const r = await getInboxLoad(db, storeId);
      expect(r.unreadMessages).toBe(2);
      expect(r.openThreads).toBe(1);
    });
  });

  describe("getDisputeLoad", () => {
    it("0 disputes → active/sla 모두 0", async () => {
      const r = await getDisputeLoad(db, storeId);
      expect(r).toEqual({ active: 0, slaExceeded: 0 });
    });

    it("open + in_review + sla_exceeded 분류 정확", async () => {
      const now = new Date();
      const due = new Date(now.getTime() + 86400000);
      await db.insert(disputes).values([
        {
          storeId,
          category: "no_show",
          status: "open",
          description: "x",
          slaDueAt: due,
        },
        {
          storeId,
          category: "refund",
          status: "in_review",
          description: "x",
          slaDueAt: due,
        },
        {
          storeId,
          category: "complaint",
          status: "sla_exceeded",
          description: "x",
          slaDueAt: due,
        },
        {
          storeId,
          category: "no_show",
          status: "resolved",
          description: "x",
          slaDueAt: due,
        },
      ]);
      const r = await getDisputeLoad(db, storeId);
      expect(r.active).toBe(2);
      expect(r.slaExceeded).toBe(1);
    });
  });

  describe("getKycStatus", () => {
    it("verification_status 없음 → unknown", async () => {
      const r = await getKycStatus(db, storeId);
      expect(r).toBe("unknown");
    });
  });
});
