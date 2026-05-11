import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bookings,
  createDbClient,
  customers,
  services,
  staff,
  type DbClient,
} from "@hesya/database";

import { resetDb, seedStore } from "@/test-helpers/db";
import {
  BOOKING_STATUSES,
  countBookingsByService,
  countBookingsByStaff,
  getBooking,
  listBookingsByStore,
  updateBookingStatus,
} from "./bookings";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe("BOOKING_STATUSES — unit", () => {
  it("4종 (scheduled / completed / cancelled / no_show)", () => {
    expect(BOOKING_STATUSES).toEqual([
      "scheduled",
      "completed",
      "cancelled",
      "no_show",
    ]);
  });
});

describe.skipIf(!hasDb)("dal.bookings (integration)", () => {
  let db: DbClient;
  let storeId: string;
  let customerId: string;
  let staffId: string;
  let serviceA: string;
  let serviceB: string;

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
    const [s] = await db
      .insert(staff)
      .values({ storeId, name: "민지" })
      .returning({ id: staff.id });
    staffId = s!.id;
    const [sv1] = await db
      .insert(services)
      .values({ storeId, nameKo: "컷", priceKrw: 30000, category: "cut" })
      .returning({ id: services.id });
    serviceA = sv1!.id;
    const [sv2] = await db
      .insert(services)
      .values({ storeId, nameKo: "펌", priceKrw: 80000, category: "perm" })
      .returning({ id: services.id });
    serviceB = sv2!.id;
  });

  it("listBookingsByStore — filter all + order by scheduledAt asc", async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 3600_000);
    await db.insert(bookings).values([
      {
        storeId,
        customerId,
        staffId,
        serviceId: serviceA,
        scheduledAt: later,
        status: "scheduled",
      },
      {
        storeId,
        customerId,
        staffId,
        serviceId: serviceB,
        scheduledAt: now,
        status: "completed",
      },
    ]);
    const rows = await listBookingsByStore(db, storeId);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.status).toBe("completed");
    expect(rows[1]!.status).toBe("scheduled");
  });

  it("listBookingsByStore — filter scheduled만 반환", async () => {
    const now = new Date();
    await db.insert(bookings).values([
      {
        storeId,
        customerId,
        staffId,
        serviceId: serviceA,
        scheduledAt: now,
        status: "scheduled",
      },
      {
        storeId,
        customerId,
        staffId,
        serviceId: serviceB,
        scheduledAt: now,
        status: "completed",
      },
    ]);
    const rows = await listBookingsByStore(db, storeId, {
      filter: "scheduled",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe("scheduled");
  });

  it("updateBookingStatus — owner store만 변경 가능", async () => {
    const [b] = await db
      .insert(bookings)
      .values({
        storeId,
        customerId,
        staffId,
        serviceId: serviceA,
        scheduledAt: new Date(),
        status: "scheduled",
      })
      .returning({ id: bookings.id });
    const updated = await updateBookingStatus(db, {
      id: b!.id,
      storeId,
      status: "no_show",
    });
    expect(updated?.status).toBe("no_show");
  });

  it("updateBookingStatus — 다른 storeId면 null (보안)", async () => {
    const otherStore = await seedStore(db, { name: "Other" });
    const [b] = await db
      .insert(bookings)
      .values({
        storeId,
        customerId,
        staffId,
        serviceId: serviceA,
        scheduledAt: new Date(),
        status: "scheduled",
      })
      .returning({ id: bookings.id });
    const updated = await updateBookingStatus(db, {
      id: b!.id,
      storeId: otherStore,
      status: "cancelled",
    });
    expect(updated).toBeNull();
    const stillScheduled = await getBooking(db, b!.id);
    expect(stillScheduled?.status).toBe("scheduled");
  });

  it("countBookingsByStaff/Service — group by + range filter", async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 86400_000 * 2);
    const future = new Date(now.getTime() + 86400_000 * 2);
    const [staff2] = await db
      .insert(staff)
      .values({ storeId, name: "수아" })
      .returning({ id: staff.id });
    await db.insert(bookings).values([
      {
        storeId,
        customerId,
        staffId,
        serviceId: serviceA,
        scheduledAt: now,
        status: "scheduled",
      },
      {
        storeId,
        customerId,
        staffId,
        serviceId: serviceA,
        scheduledAt: now,
        status: "completed",
      },
      {
        storeId,
        customerId,
        staffId: staff2!.id,
        serviceId: serviceB,
        scheduledAt: now,
        status: "scheduled",
      },
    ]);
    const staffMix = await countBookingsByStaff(db, storeId, {
      fromDate: past,
      toDate: future,
    });
    expect(staffMix).toHaveLength(2);
    const s1 = staffMix.find((x) => x.key === staffId);
    expect(s1?.count).toBe(2);

    const svcMix = await countBookingsByService(db, storeId, {
      fromDate: past,
      toDate: future,
    });
    expect(svcMix).toHaveLength(2);
    const svA = svcMix.find((x) => x.key === serviceA);
    expect(svA?.count).toBe(2);
  });
});
