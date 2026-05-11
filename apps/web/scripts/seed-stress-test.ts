/**
 * Stress test 시드 스크립트 (Phase 1-ζ.4).
 *
 * 베타 출시 직전 stability watch용 통합 부하 데이터를 로컬 DB에 시드.
 * E1 (inbox 250 메시지) + E9 (KYC 큐 4건) + E12 (분쟁 5 + API 정책 3) 통합.
 *
 * ⚠️ 안전: seed-beta-demo와 동일 가드 — `HESYA_TEST_DATABASE_URL`은
 *   localhost / 127.0.0.1 / test / supabase.local만 허용. prod URL은 throw.
 *   LLM 호출 0건 (모든 메시지/초안은 직접 insert, Anthropic 비용 0).
 *
 * 시드 내용 (총):
 *   - 매장 5곳:
 *     #1 auto_approved + IG + 사장 owner (inbox stress 대상)
 *     #2~5 manual_review + storeVerifications (admin 큐 stress)
 *   - 사장 1명 (DEMO_USER_ID = E2E_AUTH_USER_ID)
 *   - 고객 25명 + conversation 25개 (모두 매장 #1)
 *   - 메시지 250건 (conversation당 inbound 5 + outbound 5,
 *     outbound status mix: pending_review 3 / sent 1 / skipped 1)
 *   - 시술 5종 + 디자이너 3명 (매장 #1, seed-beta-demo와 동일)
 *   - 예약 50건 (매장 #1, 상태 mix)
 *   - 분쟁 5건 (매장 #1, category mix)
 *   - API 정책 알림 3건
 *
 * 실행:
 *   unset ANTHROPIC_API_KEY && pnpm seed:stress-test    # L-091
 *   pnpm dev:demo
 *
 * 검증 시나리오 (docs/stress-test-guide.md 참조):
 *   - /ko/store/inbox — 25 thread + 250 메시지 load 시간 측정
 *   - /ko/admin/store-verifications — 4건 큐 통과
 *   - /ko/store/disputes + /ko/admin/disputes — 5건 통과
 *   - /ko/store/dashboard — 시술/디자이너 분포 donut + 미응답 KPI 통과
 *   - /ko/store/bookings — 50건 5-status filter 통과
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../.env.local") });

import {
  apiPolicyAlerts,
  bookings,
  conversations,
  customers,
  eq,
  services,
  staff,
  stores,
  storeVerifications,
  users,
} from "@hesya/database";
import {
  createTestDb,
  resetDb,
  seedConversation,
  seedCustomer,
  seedDispute,
  seedMessage,
  seedStore,
  seedStoreIntegration,
  seedStoreOwner,
  seedUser,
} from "../e2e/fixtures/db";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

const STORE_COUNT = 5;
const CUSTOMERS_PER_STORE = 25;
const INBOUND_PER_CONVERSATION = 5;
const OUTBOUND_PER_CONVERSATION = 5;
const BOOKING_COUNT = 50;
const DISPUTE_COUNT = 5;
const API_ALERT_COUNT = 3;

type Language = "en" | "ja" | "zh" | "vi" | "th";

interface CustomerTemplate {
  language: Language;
  inbound: { foreign: string; korean: string };
  draft: { korean: string; foreign: string };
}

const CUSTOMER_TEMPLATES: CustomerTemplate[] = [
  {
    language: "en",
    inbound: {
      foreign: "Hi! Do you have time for a haircut today at 3pm?",
      korean: "안녕하세요! 오늘 오후 3시에 머리 자를 시간 있나요?",
    },
    draft: {
      korean:
        "안녕하세요! 네, 오후 3시 예약 가능합니다. 성함 알려주시면 예약 확정해드릴게요.",
      foreign:
        "Hello! Yes, 3pm is available. Could I have your name to confirm the booking?",
    },
  },
  {
    language: "ja",
    inbound: {
      foreign: "こんにちは!明日カットの予約は可能ですか?",
      korean: "안녕하세요! 내일 커트 예약 가능한가요?",
    },
    draft: {
      korean:
        "안녕하세요! 내일 커트 예약 가능합니다. 희망하시는 시간대가 있으신가요?",
      foreign:
        "こんにちは!明日のカットご予約、承れます。ご希望の時間帯はございますか?",
    },
  },
  {
    language: "zh",
    inbound: {
      foreign: "你好,今天下午4点可以做烫发吗?",
      korean: "안녕하세요, 오늘 오후 4시에 펌이 가능할까요?",
    },
    draft: {
      korean:
        "안녕하세요! 오늘 오후 4시 펌 예약 가능합니다. 성함을 알려주시겠어요?",
      foreign: "您好!今天下午4点烫发可以预约,请问您的姓名?",
    },
  },
  {
    language: "vi",
    inbound: {
      foreign: "Xin chào! Tôi muốn nhuộm tóc vào thứ Bảy được không?",
      korean: "안녕하세요! 토요일에 염색 가능한가요?",
    },
    draft: {
      korean:
        "안녕하세요! 토요일 염색 가능합니다. 희망하시는 컬러가 있으신가요?",
      foreign:
        "Xin chào! Thứ Bảy có thể nhuộm tóc. Bạn có màu nào mong muốn không?",
    },
  },
  {
    language: "th",
    inbound: {
      foreign: "สวัสดีค่ะ พรุ่งนี้บ่ายสองทำผมได้ไหมคะ?",
      korean: "안녕하세요! 내일 오후 2시에 머리 손질 가능할까요?",
    },
    draft: {
      korean:
        "안녕하세요! 내일 오후 2시 예약 가능합니다. 어떤 시술을 원하시나요?",
      foreign: "สวัสดีค่ะ! บ่ายสองพรุ่งนี้ว่างค่ะ ต้องการบริการอะไรคะ?",
    },
  },
];

const OUTBOUND_STATUS_PATTERN: Array<{
  status: "ai_draft" | "sent";
  draftStatus: "pending_review" | "approved" | "skipped" | null;
}> = [
  { status: "ai_draft", draftStatus: "pending_review" },
  { status: "ai_draft", draftStatus: "pending_review" },
  { status: "ai_draft", draftStatus: "pending_review" },
  { status: "sent", draftStatus: "approved" },
  { status: "ai_draft", draftStatus: "skipped" },
];

const DISPUTE_CATEGORIES: Array<{
  category: "no_show" | "refund" | "complaint";
  description: string;
}> = [
  {
    category: "complaint",
    description:
      "stress-test 분쟁 #1: 외국인 손님이 시술 후 불만 제기, 환불 요구.",
  },
  {
    category: "refund",
    description: "stress-test 분쟁 #2: 환불 정책 분쟁, 매장과 손님 입장 차이.",
  },
  {
    category: "complaint",
    description: "stress-test 분쟁 #3: AI 응답 어조 부적절 클레임.",
  },
  {
    category: "no_show",
    description: "stress-test 분쟁 #4: 예약 노쇼 처리 분쟁 신고.",
  },
  {
    category: "complaint",
    description: "stress-test 분쟁 #5: 디자이너 변경 미통지 클레임.",
  },
];

async function main(): Promise<void> {
  const db = createTestDb();

  console.log("[stress-seed] DB reset 중...");
  await resetDb(db);

  await db.delete(users).where(eq(users.id, DEMO_USER_ID));

  // 1. 사장 사용자
  await seedUser(db, {
    id: DEMO_USER_ID,
    email: "demo-owner@hesya.local",
    name: "데모 사장 (stress)",
  });

  // 2. 매장 #1 — auto_approved + IG + 사장 owner (inbox stress 대상)
  const primaryStoreId = await seedStore(db, {
    name: "Hesya stress-test 헤어샵 #1 (강남)",
  });
  await db
    .update(stores)
    .set({
      verificationStatus: "auto_approved",
      category: "hair_general",
      region: "서울 강남구",
    })
    .where(eq(stores.id, primaryStoreId));
  await seedStoreOwner(db, {
    userId: DEMO_USER_ID,
    storeId: primaryStoreId,
    role: "owner",
  });
  await seedStoreIntegration(db, {
    storeId: primaryStoreId,
    channel: "instagram",
    externalAccountId: "ig_stress_primary",
    externalPageId: "page_stress_primary",
  });

  // 3. 매장 #2~5 — manual_review (admin store-verifications 큐 stress)
  const reviewStoreIds: string[] = [];
  for (let i = 2; i <= STORE_COUNT; i += 1) {
    const sid = await seedStore(db, {
      name: `Hesya stress-test 매장 #${i} (수동 심사 대기)`,
    });
    await db
      .update(stores)
      .set({
        verificationStatus: "manual_review",
        category: i % 2 === 0 ? "nail" : "hair_general",
        region: "서울 마포구",
      })
      .where(eq(stores.id, sid));
    await db.insert(storeVerifications).values({
      storeId: sid,
      businessNumber: `123456789${i}`,
      representativeName: `데모 대표 #${i}`,
      declarationNoMassage: true,
      declarationNoMedicalDevice: true,
      declarationNoOrientalMedicine: true,
      selfDeclarationSignedAt: new Date(),
      verificationStatus: "manual_review",
    });
    reviewStoreIds.push(sid);
  }

  // 4. 고객 25명 + conversation 25개 + 메시지 250건 (매장 #1)
  const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
  const lastInboundAt = new Date(Date.now() - 60 * 60 * 1000);

  for (let i = 0; i < CUSTOMERS_PER_STORE; i += 1) {
    const tpl = CUSTOMER_TEMPLATES[i % CUSTOMER_TEMPLATES.length];
    if (!tpl) continue;
    const customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: `stress_${tpl.language}_${i.toString().padStart(2, "0")}`,
    });
    const convId = await seedConversation(db, {
      storeId: primaryStoreId,
      customerId,
      channel: "instagram",
      externalThreadId: `thread_stress_${i.toString().padStart(2, "0")}`,
      messagingWindowExpiresAt: expiresAt,
      lastInboundAt,
    });

    for (let j = 0; j < INBOUND_PER_CONVERSATION; j += 1) {
      await seedMessage(db, {
        conversationId: convId,
        customerId,
        storeId: primaryStoreId,
        direction: "inbound",
        text: tpl.inbound.foreign,
        translatedText: tpl.inbound.korean,
      });
    }

    for (let j = 0; j < OUTBOUND_PER_CONVERSATION; j += 1) {
      const pattern =
        OUTBOUND_STATUS_PATTERN[j % OUTBOUND_STATUS_PATTERN.length];
      if (!pattern) continue;
      await seedMessage(db, {
        conversationId: convId,
        customerId,
        storeId: primaryStoreId,
        direction: "outbound",
        text: tpl.draft.korean,
        translatedText: tpl.draft.foreign,
        status: pattern.status,
        draftStatus: pattern.draftStatus,
      });
    }

    await db
      .update(conversations)
      .set({
        lastMessagePreview: tpl.draft.korean,
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, convId));
  }

  // 5. 시술 5종 + 디자이너 3명 (매장 #1) — dashboard 분포 KPI 시연용
  const demoServices = [
    { nameKo: "커트", nameEn: "Cut", nameJa: "カット", priceKrw: 35000 },
    { nameKo: "펌", nameEn: "Perm", nameJa: "パーマ", priceKrw: 120000 },
    { nameKo: "염색", nameEn: "Color", nameJa: "カラー", priceKrw: 95000 },
    {
      nameKo: "트리트먼트",
      nameEn: "Treatment",
      nameJa: "トリートメント",
      priceKrw: 55000,
    },
    {
      nameKo: "두피 케어",
      nameEn: "Scalp Care",
      nameJa: "頭皮ケア",
      priceKrw: 70000,
    },
  ];
  const serviceIds: string[] = [];
  for (const s of demoServices) {
    const [row] = await db
      .insert(services)
      .values({ ...s, storeId: primaryStoreId })
      .returning({ id: services.id });
    if (!row) throw new Error("services seed: insert returned no row");
    serviceIds.push(row.id);
  }

  const demoStaff = [
    { name: "stress 디자이너 A", languages: ["ko", "en"] },
    { name: "stress 디자이너 B", languages: ["ko", "ja"] },
    { name: "stress 디자이너 C", languages: ["ko"] },
  ];
  const staffIds: string[] = [];
  for (const s of demoStaff) {
    const [row] = await db
      .insert(staff)
      .values({ ...s, storeId: primaryStoreId })
      .returning({ id: staff.id });
    if (!row) throw new Error("staff seed: insert returned no row");
    staffIds.push(row.id);
  }

  // 6. 예약 50건 (매장 #1, 상태 mix) — dashboard donut + bookings list stress
  const firstCustomerRow = await db
    .select({ id: customers.id })
    .from(customers)
    .limit(1);
  const firstCustomerId = firstCustomerRow[0]?.id ?? null;

  const now = new Date();
  const statusCycle = [
    "scheduled",
    "completed",
    "completed",
    "completed",
    "scheduled",
    "no_show",
    "cancelled",
    "completed",
    "scheduled",
    "completed",
  ] as const;
  for (let i = 0; i < BOOKING_COUNT; i += 1) {
    const scheduledAt = new Date(now.getTime() + (i - 20) * 86400000);
    const svc = demoServices[i % demoServices.length];
    if (!svc) continue;
    const svcId = serviceIds[i % serviceIds.length] ?? null;
    const stfId = staffIds[i % staffIds.length] ?? null;
    const status = statusCycle[i % statusCycle.length] ?? "scheduled";
    await db.insert(bookings).values({
      storeId: primaryStoreId,
      customerId: firstCustomerId,
      serviceId: svcId,
      staffId: stfId,
      scheduledAt,
      status,
      totalPriceKrw: svc.priceKrw,
      depositPaidKrw: Math.floor(svc.priceKrw * 0.3),
    });
  }

  // 7. 분쟁 5건 (매장 #1, category mix)
  const seededDisputeIds: string[] = [];
  for (let i = 0; i < DISPUTE_COUNT; i += 1) {
    const d = DISPUTE_CATEGORIES[i % DISPUTE_CATEGORIES.length];
    if (!d) continue;
    const did = await seedDispute(db, {
      storeId: primaryStoreId,
      filedByUserId: DEMO_USER_ID,
      category: d.category,
      description: d.description,
    });
    seededDisputeIds.push(did);
  }

  // 8. API 정책 알림 3건 (Epic 12.8 admin 큐 stress)
  for (let i = 0; i < API_ALERT_COUNT; i += 1) {
    await db.insert(apiPolicyAlerts).values({
      source: "meta-blog",
      title: `Stress-test 정책 알림 #${i + 1}: Graph API sample update`,
      link: `https://developers.facebook.com/blog/post/stress-${i + 1}`,
      guid: `stress-seed-meta-${i + 1}`,
      pubDate: new Date(
        `2026-05-${(8 + i).toString().padStart(2, "0")}T00:00:00Z`,
      ),
      status: "new",
    });
  }

  const totalMessages =
    CUSTOMERS_PER_STORE *
    (INBOUND_PER_CONVERSATION + OUTBOUND_PER_CONVERSATION);

  console.log("[stress-seed] ✓ 시드 완료");
  console.log("");
  console.log("  사장 user id           :", DEMO_USER_ID);
  console.log("  매장 #1 (inbox stress) :", primaryStoreId);
  console.log("  매장 #2~5 (admin 큐)   :", reviewStoreIds.length, "건");
  console.log("  메시지                 :", totalMessages, "건");
  console.log("  예약                   :", BOOKING_COUNT, "건");
  console.log("  분쟁                   :", seededDisputeIds.length, "건");
  console.log("  API 정책 알림           :", API_ALERT_COUNT, "건");
  console.log("");
  console.log("  사장 inbox     : http://localhost:4200/ko/store/inbox");
  console.log("  사장 예약      : http://localhost:4200/ko/store/bookings");
  console.log("  사장 대시보드  : http://localhost:4200/ko/store/dashboard");
  console.log("  사장 분쟁      : http://localhost:4200/ko/store/disputes");
  console.log(
    "  운영자 KYC 큐  : http://localhost:4200/ko/admin/store-verifications",
  );
  console.log("  운영자 분쟁 큐 : http://localhost:4200/ko/admin/disputes");
  console.log(
    "  API 정책 큐    : http://localhost:4200/ko/admin/api-policy-alerts",
  );
  console.log("");
  console.log("  다음: pnpm dev:demo");
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("[stress-seed] 실패:", err);
    process.exit(1);
  });
