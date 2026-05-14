/**
 * admin-dashboard DAL — unit + integration tests.
 *
 * Cover 함수:
 *   - PR #158: normalizeRegionToCode (unit), getDisputeSlaResolution,
 *              getStoreRegionDistribution, getTopCategoriesByGmv
 *   - PR #154: getAdminAlertCounts, getAdminKpiSummary
 *   - PR #156: getMonthlyNewStoresCounts
 *
 * 별도 PR backfill 예정 (격리 제약):
 *   - getAdminAuditTrail — kyc_verification_logs IMMUTABLE (BEFORE DELETE trigger)
 *   - getDailyAiCostSpark — messages FK chain (conversations + customers seed 필요)
 */
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  apiPolicyAlerts,
  bookings,
  createDbClient,
  customers,
  disputes,
  services,
  stores,
  storeDeletionRequests,
  type DbClient,
} from "@hesya/database";

import { resetDb, seedCustomer, seedStore } from "@/test-helpers/db";
import {
  getAdminAlertCounts,
  getAdminKpiSummary,
  getDisputeSlaResolution,
  getMonthlyNewStoresCounts,
  getStoreRegionDistribution,
  getTopCategoriesByGmv,
  normalizeRegionToCode,
} from "./admin-dashboard";

describe("normalizeRegionToCode (unit, no DB)", () => {
  it("null 또는 빈 문자열 → null", () => {
    expect(normalizeRegionToCode(null)).toBeNull();
    expect(normalizeRegionToCode("")).toBeNull();
    expect(normalizeRegionToCode("   ")).toBeNull();
  });

  it("시도 alias 짧은 형태 → 코드", () => {
    expect(normalizeRegionToCode("서울")).toBe("11");
    expect(normalizeRegionToCode("부산")).toBe("26");
    expect(normalizeRegionToCode("제주")).toBe("50");
  });

  it("시도 alias 풀네임 → 같은 코드", () => {
    expect(normalizeRegionToCode("서울특별시")).toBe("11");
    expect(normalizeRegionToCode("부산광역시")).toBe("26");
    expect(normalizeRegionToCode("제주특별자치도")).toBe("50");
  });

  it("자유 입력 '서울 강남구' → 첫 토큰 매칭", () => {
    expect(normalizeRegionToCode("서울 강남구")).toBe("11");
    expect(normalizeRegionToCode("강원도 춘천시")).toBe("42");
    expect(normalizeRegionToCode("경기도 분당구 정자동")).toBe("41");
  });

  it("강원 구버전 / 신버전 동일 코드", () => {
    expect(normalizeRegionToCode("강원도")).toBe("42");
    expect(normalizeRegionToCode("강원특별자치도")).toBe("42");
    expect(normalizeRegionToCode("강원")).toBe("42");
  });

  it("전북 구버전 / 신버전 동일 코드", () => {
    expect(normalizeRegionToCode("전라북도")).toBe("45");
    expect(normalizeRegionToCode("전북특별자치도")).toBe("45");
    expect(normalizeRegionToCode("전북")).toBe("45");
  });

  it("매칭 안 되는 첫 단어 → null", () => {
    expect(normalizeRegionToCode("도쿄")).toBeNull();
    expect(normalizeRegionToCode("Unknown")).toBeNull();
    expect(normalizeRegionToCode("기타")).toBeNull();
  });
});

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.admin-dashboard (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  describe("getDisputeSlaResolution", () => {
    it("기간 내 resolved 0건 → empty=true + pct=0", async () => {
      await seedStore(db);
      const r = await getDisputeSlaResolution(db, 30);
      expect(r).toEqual({
        withinSla: 0,
        totalResolved: 0,
        pct: 0,
        empty: true,
      });
    });

    it("기간 내 SLA 안에 처리 3건 / 초과 1건 → pct=75", async () => {
      const storeId = await seedStore(db);
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const inSla = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const breach = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await db.insert(disputes).values([
        // resolvedAt < slaDueAt (within)
        {
          storeId,
          category: "refund",
          description: "x",
          status: "resolved",
          slaDueAt: breach,
          resolvedAt: inSla,
        },
        {
          storeId,
          category: "refund",
          description: "x",
          status: "resolved",
          slaDueAt: breach,
          resolvedAt: inSla,
        },
        {
          storeId,
          category: "no_show",
          description: "x",
          status: "resolved",
          slaDueAt: breach,
          resolvedAt: inSla,
        },
        // resolvedAt > slaDueAt (breach)
        {
          storeId,
          category: "complaint",
          description: "x",
          status: "resolved",
          slaDueAt: dayAgo,
          resolvedAt: inSla,
        },
      ]);

      const r = await getDisputeSlaResolution(db, 30);
      expect(r.totalResolved).toBe(4);
      expect(r.withinSla).toBe(3);
      expect(r.pct).toBe(75);
      expect(r.empty).toBe(false);
    });

    it("resolvedAt 없는 분쟁 (open) 제외", async () => {
      const storeId = await seedStore(db);
      const breach = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.insert(disputes).values({
        storeId,
        category: "refund",
        description: "x",
        status: "open",
        slaDueAt: breach,
        // resolvedAt 미설정 (null)
      });
      const r = await getDisputeSlaResolution(db, 30);
      expect(r.empty).toBe(true);
    });

    it("기간 밖 (60일 전 resolved) 제외", async () => {
      const storeId = await seedStore(db);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const seventyDaysAgo = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000);
      await db.insert(disputes).values({
        storeId,
        category: "refund",
        description: "x",
        status: "resolved",
        slaDueAt: sixtyDaysAgo,
        resolvedAt: seventyDaysAgo,
      });
      const r = await getDisputeSlaResolution(db, 30);
      expect(r.empty).toBe(true);
    });
  });

  describe("getStoreRegionDistribution", () => {
    it("auto_approved 매장 0건 → empty=true", async () => {
      const r = await getStoreRegionDistribution(db);
      expect(r.empty).toBe(true);
      expect(r.regions).toHaveLength(17);
      expect(r.unknown).toBe(0);
    });

    it("서울 강남구 매장 3건 / 부산 1건 → 11=3, 26=1", async () => {
      await db.insert(stores).values([
        {
          name: "강남샵",
          region: "서울 강남구",
          verificationStatus: "auto_approved",
        },
        {
          name: "홍대샵",
          region: "서울특별시 마포구",
          verificationStatus: "auto_approved",
        },
        {
          name: "이태원샵",
          region: "서울",
          verificationStatus: "auto_approved",
        },
        {
          name: "해운대샵",
          region: "부산",
          verificationStatus: "auto_approved",
        },
      ]);
      const r = await getStoreRegionDistribution(db);
      const seoul = r.regions.find((reg) => reg.code === "11");
      const busan = r.regions.find((reg) => reg.code === "26");
      expect(seoul?.stores).toBe(3);
      expect(busan?.stores).toBe(1);
      expect(r.unknown).toBe(0);
      expect(r.empty).toBe(false);
    });

    it("매칭 안 되는 region은 unknown 버킷", async () => {
      await db.insert(stores).values([
        {
          name: "도쿄샵",
          region: "도쿄",
          verificationStatus: "auto_approved",
        },
        {
          name: "null샵",
          region: null,
          verificationStatus: "auto_approved",
        },
      ]);
      const r = await getStoreRegionDistribution(db);
      expect(r.unknown).toBe(2);
      expect(r.regions.every((reg) => reg.stores === 0)).toBe(true);
      expect(r.empty).toBe(false);
    });

    it("manual_review / soft-deleted 매장 제외", async () => {
      await db.insert(stores).values([
        {
          name: "검토중",
          region: "서울",
          verificationStatus: "manual_review",
        },
        {
          name: "삭제됨",
          region: "서울",
          verificationStatus: "auto_approved",
          deletedAt: new Date(),
        },
      ]);
      const r = await getStoreRegionDistribution(db);
      expect(r.empty).toBe(true);
    });

    it("17 시도 row는 항상 유지 (stores=0이어도)", async () => {
      const r = await getStoreRegionDistribution(db);
      expect(r.regions).toHaveLength(17);
      const codes = r.regions.map((reg) => reg.code).sort();
      expect(codes[0]).toBe("11"); // 서울
      expect(codes[codes.length - 1]).toBe("50"); // 제주
    });
  });

  describe("getTopCategoriesByGmv", () => {
    it("booking 0건 → 빈 배열", async () => {
      const rows = await getTopCategoriesByGmv(db);
      expect(rows).toEqual([]);
    });

    it("category별 GMV 합산 + Top N 정렬", async () => {
      const storeId = await seedStore(db);
      const customerId = await seedCustomer(db, {
        channel: "instagram",
        externalId: "test1",
      });
      const [s1] = await db
        .insert(services)
        .values({
          storeId,
          nameKo: "헤어컬러A",
          priceKrw: 100000,
          category: "헤어컬러",
        })
        .returning({ id: services.id });
      const [s2] = await db
        .insert(services)
        .values({
          storeId,
          nameKo: "헤어컬러B",
          priceKrw: 150000,
          category: "헤어컬러",
        })
        .returning({ id: services.id });
      const [s3] = await db
        .insert(services)
        .values({
          storeId,
          nameKo: "스킨케어",
          priceKrw: 80000,
          category: "스킨케어",
        })
        .returning({ id: services.id });

      const future = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1일 전
      await db.insert(bookings).values([
        // 헤어컬러: 100k + 150k + 100k = 350k
        {
          storeId,
          customerId,
          serviceId: s1!.id,
          scheduledAt: future,
          status: "confirmed",
          totalPriceKrw: 100_000,
        },
        {
          storeId,
          customerId,
          serviceId: s2!.id,
          scheduledAt: future,
          status: "completed",
          totalPriceKrw: 150_000,
        },
        {
          storeId,
          customerId,
          serviceId: s1!.id,
          scheduledAt: future,
          status: "confirmed",
          totalPriceKrw: 100_000,
        },
        // 스킨케어: 80k
        {
          storeId,
          customerId,
          serviceId: s3!.id,
          scheduledAt: future,
          status: "confirmed",
          totalPriceKrw: 80_000,
        },
      ]);

      const rows = await getTopCategoriesByGmv(db, 5, 30);
      expect(rows).toHaveLength(2);
      expect(rows[0]!.name).toBe("헤어컬러");
      expect(rows[0]!.gmvKrw).toBe(350_000);
      expect(rows[0]!.shareRatio).toBe(1);
      expect(rows[1]!.name).toBe("스킨케어");
      expect(rows[1]!.gmvKrw).toBe(80_000);
      expect(rows[1]!.shareRatio).toBeCloseTo(80_000 / 350_000, 3);
    });

    it("cancelled 제외", async () => {
      const storeId = await seedStore(db);
      const customerId = await seedCustomer(db, {
        channel: "instagram",
        externalId: "test2",
      });
      const [svc] = await db
        .insert(services)
        .values({
          storeId,
          nameKo: "x",
          priceKrw: 100000,
          category: "헤어컬러",
        })
        .returning({ id: services.id });

      const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await db.insert(bookings).values([
        {
          storeId,
          customerId,
          serviceId: svc!.id,
          scheduledAt: past,
          status: "cancelled",
          totalPriceKrw: 999_999,
        },
        {
          storeId,
          customerId,
          serviceId: svc!.id,
          scheduledAt: past,
          status: "confirmed",
          totalPriceKrw: 50_000,
        },
      ]);

      const rows = await getTopCategoriesByGmv(db);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.gmvKrw).toBe(50_000);
    });

    it("category null → '기타' 라벨", async () => {
      const storeId = await seedStore(db);
      const customerId = await seedCustomer(db, {
        channel: "instagram",
        externalId: "test3",
      });
      const [svc] = await db
        .insert(services)
        .values({ storeId, nameKo: "x", priceKrw: 100000, category: null })
        .returning({ id: services.id });
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await db.insert(bookings).values({
        storeId,
        customerId,
        serviceId: svc!.id,
        scheduledAt: past,
        status: "confirmed",
        totalPriceKrw: 30_000,
      });

      const rows = await getTopCategoriesByGmv(db);
      expect(rows[0]!.name).toBe("기타");
    });

    it("limit 적용", async () => {
      const storeId = await seedStore(db);
      const customerId = await seedCustomer(db, {
        channel: "instagram",
        externalId: "test4",
      });
      const categoryNames = ["a", "b", "c", "d", "e", "f", "g"];
      const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
      for (const [i, name] of categoryNames.entries()) {
        const [svc] = await db
          .insert(services)
          .values({
            storeId,
            nameKo: name,
            priceKrw: 100000,
            category: name,
          })
          .returning({ id: services.id });
        await db.insert(bookings).values({
          storeId,
          customerId,
          serviceId: svc!.id,
          scheduledAt: past,
          status: "confirmed",
          totalPriceKrw: (i + 1) * 10_000,
        });
      }

      const rows = await getTopCategoriesByGmv(db, 3);
      expect(rows).toHaveLength(3);
      expect(rows[0]!.name).toBe("g"); // 70k
      expect(rows[2]!.name).toBe("e"); // 50k
    });
  });

  describe("getAdminAlertCounts", () => {
    it("아무 데이터 없음 → 4 필드 모두 0", async () => {
      const r = await getAdminAlertCounts(db);
      expect(r).toEqual({
        pendingKyc: 0,
        openDisputes: 0,
        newApiPolicyAlerts: 0,
        pendingStoreDeletions: 0,
      });
    });

    it("manual_review 매장 2건 → pendingKyc=2 (auto_approved/soft-deleted 제외)", async () => {
      await db.insert(stores).values([
        { name: "검토중1", verificationStatus: "manual_review" },
        { name: "검토중2", verificationStatus: "manual_review" },
        { name: "승인됨", verificationStatus: "auto_approved" },
        {
          name: "검토중-삭제됨",
          verificationStatus: "manual_review",
          deletedAt: new Date(),
        },
      ]);
      const r = await getAdminAlertCounts(db);
      expect(r.pendingKyc).toBe(2);
    });

    it("open + in_review 분쟁만 openDisputes에 합산", async () => {
      const storeId = await seedStore(db);
      const future = new Date(Date.now() + 86_400_000);
      await db.insert(disputes).values([
        {
          storeId,
          category: "refund",
          description: "x",
          status: "open",
          slaDueAt: future,
        },
        {
          storeId,
          category: "refund",
          description: "x",
          status: "in_review",
          slaDueAt: future,
        },
        {
          storeId,
          category: "refund",
          description: "x",
          status: "resolved",
          slaDueAt: future,
          resolvedAt: new Date(),
        },
      ]);
      const r = await getAdminAlertCounts(db);
      expect(r.openDisputes).toBe(2);
    });

    it("status='new' API 정책 알림만 newApiPolicyAlerts에 합산", async () => {
      await db.insert(apiPolicyAlerts).values([
        {
          source: "meta",
          title: "t1",
          link: "https://x.test/1",
          guid: "g1",
          status: "new",
        },
        {
          source: "meta",
          title: "t2",
          link: "https://x.test/2",
          guid: "g2",
          status: "new",
        },
        {
          source: "meta",
          title: "t3",
          link: "https://x.test/3",
          guid: "g3",
          status: "reviewed",
        },
      ]);
      const r = await getAdminAlertCounts(db);
      expect(r.newApiPolicyAlerts).toBe(2);
    });

    it("cancelledAt NULL 삭제 요청만 pendingStoreDeletions에 합산", async () => {
      const future = new Date(Date.now() + 30 * 86_400_000);
      await db.insert(storeDeletionRequests).values([
        {
          storeNameSnapshot: "S1",
          source: "owner",
          requestedByEmail: "a@x.test",
          scheduledPurgeAt: future,
        },
        {
          storeNameSnapshot: "S2",
          source: "admin",
          requestedByEmail: "b@x.test",
          scheduledPurgeAt: future,
        },
        {
          storeNameSnapshot: "S3-cancelled",
          source: "owner",
          requestedByEmail: "c@x.test",
          scheduledPurgeAt: future,
          cancelledAt: new Date(),
          cancelledByEmail: "c@x.test",
        },
      ]);
      const r = await getAdminAlertCounts(db);
      expect(r.pendingStoreDeletions).toBe(2);
    });
  });

  describe("getAdminKpiSummary", () => {
    const range = () => {
      const now = new Date();
      const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const toDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      return { fromDate, toDate };
    };

    it("아무 데이터 없음 → 모든 카운트 0 + 빈 nationality 배열", async () => {
      const r = await getAdminKpiSummary(db, range());
      expect(r).toEqual({
        activeStores: 0,
        totalRegistered: 0,
        newStoresToday: 0,
        foreignGmvMtdKrw: 0,
        foreignBookingsMtd: 0,
        foreignBookingsByNationality: [],
      });
    });

    it("auto_approved=3 + manual_review=2 + soft-deleted=1 → active=3, total=5", async () => {
      await db.insert(stores).values([
        { name: "A1", verificationStatus: "auto_approved" },
        { name: "A2", verificationStatus: "auto_approved" },
        { name: "A3", verificationStatus: "auto_approved" },
        { name: "M1", verificationStatus: "manual_review" },
        { name: "M2", verificationStatus: "manual_review" },
        {
          name: "DEL",
          verificationStatus: "auto_approved",
          deletedAt: new Date(),
        },
      ]);
      const r = await getAdminKpiSummary(db, range());
      expect(r.activeStores).toBe(3);
      expect(r.totalRegistered).toBe(5);
    });

    it("오늘 createdAt 매장만 newStoresToday 합산", async () => {
      const todayStart = new Date();
      todayStart.setUTCHours(12, 0, 0, 0);
      const yesterday = new Date(Date.now() - 86_400_000);
      await db.insert(stores).values([
        { name: "오늘1", verificationStatus: "auto_approved" }, // defaultNow
        { name: "오늘2", verificationStatus: "auto_approved" },
        {
          name: "어제",
          verificationStatus: "auto_approved",
          createdAt: yesterday,
        },
      ]);
      const r = await getAdminKpiSummary(db, range());
      expect(r.newStoresToday).toBe(2);
    });

    it("이번달 booking GMV 합산 (cancelled 제외)", async () => {
      const storeId = await seedStore(db);
      const customerId = await seedCustomer(db, {
        channel: "instagram",
        externalId: "kpi-1",
      });
      const [svc] = await db
        .insert(services)
        .values({ storeId, nameKo: "x", priceKrw: 50_000 })
        .returning({ id: services.id });
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10);
      await db.insert(bookings).values([
        {
          storeId,
          customerId,
          serviceId: svc!.id,
          scheduledAt: thisMonth,
          status: "confirmed",
          totalPriceKrw: 80_000,
        },
        {
          storeId,
          customerId,
          serviceId: svc!.id,
          scheduledAt: thisMonth,
          status: "completed",
          totalPriceKrw: 120_000,
        },
        {
          storeId,
          customerId,
          serviceId: svc!.id,
          scheduledAt: thisMonth,
          status: "cancelled",
          totalPriceKrw: 999_999,
        },
      ]);
      const r = await getAdminKpiSummary(db, range());
      expect(r.foreignGmvMtdKrw).toBe(200_000);
      expect(r.foreignBookingsMtd).toBe(2);
    });

    it("nationality 그룹 + count 정렬 (desc) + null/공백 → 'unknown'", async () => {
      const storeId = await seedStore(db);
      const [svc] = await db
        .insert(services)
        .values({ storeId, nameKo: "x", priceKrw: 10_000 })
        .returning({ id: services.id });
      const [jp1] = await db
        .insert(customers)
        .values({
          channel: "instagram",
          externalId: "jp1",
          nationality: "JP",
        })
        .returning({ id: customers.id });
      const [jp2] = await db
        .insert(customers)
        .values({
          channel: "instagram",
          externalId: "jp2",
          nationality: "JP",
        })
        .returning({ id: customers.id });
      const [us1] = await db
        .insert(customers)
        .values({
          channel: "instagram",
          externalId: "us1",
          nationality: "US",
        })
        .returning({ id: customers.id });
      const [unk1] = await db
        .insert(customers)
        .values({
          channel: "instagram",
          externalId: "unk1",
          nationality: null,
        })
        .returning({ id: customers.id });

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 10);
      await db.insert(bookings).values([
        {
          storeId,
          customerId: jp1!.id,
          serviceId: svc!.id,
          scheduledAt: thisMonth,
          status: "confirmed",
          totalPriceKrw: 10_000,
        },
        {
          storeId,
          customerId: jp2!.id,
          serviceId: svc!.id,
          scheduledAt: thisMonth,
          status: "confirmed",
          totalPriceKrw: 10_000,
        },
        {
          storeId,
          customerId: us1!.id,
          serviceId: svc!.id,
          scheduledAt: thisMonth,
          status: "confirmed",
          totalPriceKrw: 10_000,
        },
        {
          storeId,
          customerId: unk1!.id,
          serviceId: svc!.id,
          scheduledAt: thisMonth,
          status: "confirmed",
          totalPriceKrw: 10_000,
        },
      ]);
      const r = await getAdminKpiSummary(db, range());
      expect(r.foreignBookingsByNationality[0]).toEqual({
        nationality: "JP",
        count: 2,
      });
      const us = r.foreignBookingsByNationality.find(
        (n) => n.nationality === "US",
      );
      const unk = r.foreignBookingsByNationality.find(
        (n) => n.nationality === "unknown",
      );
      expect(us?.count).toBe(1);
      expect(unk?.count).toBe(1);
    });
  });

  describe("getMonthlyNewStoresCounts", () => {
    it("0건 → 12 row 모두 value=0", async () => {
      const rows = await getMonthlyNewStoresCounts(db);
      expect(rows).toHaveLength(12);
      expect(rows.every((r) => r.value === 0)).toBe(true);
    });

    it("최근 3개월 매장 시드 → 마지막 3 bucket에 분배", async () => {
      const now = new Date();
      // 이번 달, 1개월 전, 2개월 전 시드 (각 1건씩).
      const thisMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15),
      );
      const oneAgo = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15),
      );
      const twoAgo = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 15),
      );
      await db.insert(stores).values([
        { name: "thisMonth", createdAt: thisMonth },
        { name: "oneAgo", createdAt: oneAgo },
        { name: "twoAgo", createdAt: twoAgo },
      ]);
      const rows = await getMonthlyNewStoresCounts(db, now);
      expect(rows).toHaveLength(12);
      expect(rows[11]!.value).toBe(1); // 이번 달 (가장 최근)
      expect(rows[10]!.value).toBe(1); // 1개월 전
      expect(rows[9]!.value).toBe(1); // 2개월 전
      expect(rows.slice(0, 9).every((r) => r.value === 0)).toBe(true);
    });

    it("soft-deleted (deletedAt NOT NULL) 매장 제외", async () => {
      const now = new Date();
      const thisMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10),
      );
      await db.insert(stores).values([
        { name: "live", createdAt: thisMonth },
        { name: "deleted", createdAt: thisMonth, deletedAt: new Date() },
      ]);
      const rows = await getMonthlyNewStoresCounts(db, now);
      expect(rows[11]!.value).toBe(1);
    });

    it("12개월 초과 (13개월 전) 매장 제외", async () => {
      const now = new Date();
      const thirteenAgo = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 13, 15),
      );
      await db
        .insert(stores)
        .values([{ name: "tooOld", createdAt: thirteenAgo }]);
      const rows = await getMonthlyNewStoresCounts(db, now);
      expect(rows.every((r) => r.value === 0)).toBe(true);
    });
  });
});
