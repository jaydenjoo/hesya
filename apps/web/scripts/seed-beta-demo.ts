/**
 * 베타 데모 시드 스크립트.
 *
 * 본인 PC + 휴대폰 시연용 — 가상 매장/사장/외국인 고객으로 사장 입장 클릭
 * 시뮬을 가능케 함. e2e/fixtures/db.ts 헬퍼 8종 + phase-1-beta.spec.ts의
 * `lastMessagePreview` set 패턴 재활용.
 *
 * ⚠️ 안전:
 *   - `HESYA_TEST_DATABASE_URL` 필요 (localhost / 127.0.0.1 / test / supabase.local만 허용)
 *   - prod DB 절대 금지 — fixture가 URL 검증 후 throw
 *   - IG 토큰은 mock 문자열 (실제 Instagram API 호출 차단)
 *   - 실행 시 매번 `resetDb` → 로컬 DB 데이터 전부 삭제 (전제: 이 DB는 데모/테스트 전용)
 *
 * 시드 내용:
 *   - 사장 1명 (id = `DEMO_USER_ID`, `E2E_AUTH_USER_ID`로 dev 서버에 동일 값 주입 필요)
 *   - 매장 2개:
 *     * #1 auto_approved (`bot_mode=false` 검수·승인 모드 — 기본값)
 *     * #2 manual_review (admin 큐 데모용, 사장 연결 없음)
 *   - storeVerifications 1건 (#2용)
 *   - IG integration 1건 (#1, mock token)
 *   - 고객 3명 (영어 / 일본어 / 중국어)
 *   - 각 고객당 inbound 1 + AI `pending_review` 초안 1 = 메시지 6건
 *   - PRD §268 일관: outbound originalText 한국어 + translatedText 외국어,
 *     inbound originalText 외국어 + translatedText 한국어 (사장 검수 보조)
 *
 * 실행:
 *   pnpm seed:demo
 *
 * 다음:
 *   pnpm dev:demo   # http://localhost:4200/ko/store/inbox
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

/**
 * 데모 사장 user id. dev 서버 기동 시 `E2E_AUTH_USER_ID`로 동일 값을 주입하면
 * `requireStoreOwnerAuth`가 이 user로 bypass 인증 (NODE_ENV !== "production"
 * + dev 서버 모두 만족 시).
 */
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * PRD §268 (MVP 결정): outbound `originalText`는 한국어, `translatedText`는
 * 외국어 검수용 보조. inbound는 외국어 원문 + 한국어 번역. 사장 inbox에서는
 * 둘 다 표시되어 외국어 못 읽는 사장도 의미 파악 + 외국 고객 입장 미리보기 가능.
 */
interface DemoCustomer {
  language: "en" | "ja" | "zh";
  externalId: string;
  inbound: { foreign: string; korean: string };
  draft: { korean: string; foreign: string };
}

const DEMO_CUSTOMERS: DemoCustomer[] = [
  {
    language: "en",
    externalId: "demo_en_alice",
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
    externalId: "demo_ja_haruka",
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
    externalId: "demo_zh_xiaohua",
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
];

async function main(): Promise<void> {
  const db = createTestDb();

  console.log("[demo-seed] DB reset 중...");
  await resetDb(db);

  // resetDb는 users 테이블을 안 지움 (Better Auth 로그인으로 만들어진 다른 user
  // 보존 의도). 두 번째 실행 시 demo user PK 충돌 방지를 위해 명시 삭제 —
  // 이 시점엔 storeOwners/customers/messages 등 user FK 의존 row가 모두 비워졌음.
  await db.delete(users).where(eq(users.id, DEMO_USER_ID));

  // 1. 사장 사용자 (E2E_AUTH_USER_ID와 동일한 고정 UUID)
  await seedUser(db, {
    id: DEMO_USER_ID,
    email: "demo-owner@hesya.local",
    name: "데모 사장",
  });

  // 2-a. auto_approved 매장 — 실제 inbox/검수 모드 시연 대상
  const autoStoreId = await seedStore(db, {
    name: "Hesya 데모 헤어샵 (강남)",
  });
  await db
    .update(stores)
    .set({
      verificationStatus: "auto_approved",
      category: "hair_general",
      region: "서울 강남구",
    })
    .where(eq(stores.id, autoStoreId));
  await seedStoreOwner(db, {
    userId: DEMO_USER_ID,
    storeId: autoStoreId,
    role: "owner",
  });
  await seedStoreIntegration(db, {
    storeId: autoStoreId,
    channel: "instagram",
    externalAccountId: "ig_demo_auto",
    externalPageId: "page_demo_auto",
  });

  // 2-b. manual_review 매장 — 운영자 큐 시연 대상 (사장 연결 없음)
  const reviewStoreId = await seedStore(db, {
    name: "Hesya 데모 네일샵 (수동 심사 대기)",
  });
  await db
    .update(stores)
    .set({
      verificationStatus: "manual_review",
      category: "nail",
      region: "서울 마포구",
    })
    .where(eq(stores.id, reviewStoreId));
  await db.insert(storeVerifications).values({
    storeId: reviewStoreId,
    businessNumber: "1234567890",
    representativeName: "데모 대표",
    declarationNoMassage: true,
    declarationNoMedicalDevice: true,
    declarationNoOrientalMedicine: true,
    selfDeclarationSignedAt: new Date(),
    verificationStatus: "manual_review",
  });

  // 3. 고객 3명 + 각자 conversation + inbound + pending_review 초안
  const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
  const lastInboundAt = new Date(Date.now() - 60 * 60 * 1000);

  for (const c of DEMO_CUSTOMERS) {
    const customerId = await seedCustomer(db, {
      channel: "instagram",
      externalId: c.externalId,
    });
    const convId = await seedConversation(db, {
      storeId: autoStoreId,
      customerId,
      channel: "instagram",
      externalThreadId: `thread_demo_${c.language}`,
      messagingWindowExpiresAt: expiresAt,
      lastInboundAt,
    });
    await seedMessage(db, {
      conversationId: convId,
      customerId,
      storeId: autoStoreId,
      direction: "inbound",
      text: c.inbound.foreign,
      translatedText: c.inbound.korean,
    });
    await seedMessage(db, {
      conversationId: convId,
      customerId,
      storeId: autoStoreId,
      direction: "outbound",
      text: c.draft.korean,
      translatedText: c.draft.foreign,
      status: "ai_draft",
      draftStatus: "pending_review",
    });
    // ThreadItem이 conversations.lastMessagePreview를 표시 — 사장이 보는
    // 마지막 메시지 미리보기는 한국어 (originalText)로.
    await db
      .update(conversations)
      .set({
        lastMessagePreview: c.draft.korean,
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, convId));
  }

  // 3-b. 데모 시술 5종 (Epic 3 dashboard 분포 KPI 시연용)
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
      .values({ ...s, storeId: autoStoreId })
      .returning({ id: services.id });
    if (!row) throw new Error("services seed: insert returned no row");
    serviceIds.push(row.id);
  }

  // 3-c. 데모 디자이너 3명
  const demoStaff = [
    { name: "데모 디자이너 A", languages: ["ko", "en"] },
    { name: "데모 디자이너 B", languages: ["ko", "ja"] },
    { name: "데모 디자이너 C", languages: ["ko"] },
  ];
  const staffIds: string[] = [];
  for (const s of demoStaff) {
    const [row] = await db
      .insert(staff)
      .values({ ...s, storeId: autoStoreId })
      .returning({ id: staff.id });
    if (!row) throw new Error("staff seed: insert returned no row");
    staffIds.push(row.id);
  }

  // 3-d. 데모 예약 10건 (시술/디자이너/고객/상태 mix — 분포 KPI 시각화)
  const customerIdRow = await db
    .select({ id: customers.id })
    .from(customers)
    .limit(1);
  const firstCustomerId = customerIdRow[0]?.id ?? null;

  const bookingStatuses = [
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
  const now = new Date();
  for (let i = 0; i < 10; i += 1) {
    const scheduledAt = new Date(now.getTime() + (i - 4) * 86400000);
    const svc = demoServices[i % demoServices.length];
    if (!svc) continue;
    const svcId = serviceIds[i % serviceIds.length] ?? null;
    const stfId = staffIds[i % staffIds.length] ?? null;
    const status = bookingStatuses[i] ?? "scheduled";
    await db.insert(bookings).values({
      storeId: autoStoreId,
      customerId: firstCustomerId,
      serviceId: svcId,
      staffId: stfId,
      scheduledAt,
      status,
      totalPriceKrw: svc.priceKrw,
      depositPaidKrw: Math.floor(svc.priceKrw * 0.3),
    });
  }

  // 4. 분쟁 1건 (Epic 12.4 시연용 — 매장 #1, status=open)
  const seededDisputeId = await seedDispute(db, {
    storeId: autoStoreId,
    filedByUserId: DEMO_USER_ID,
    category: "complaint",
    description:
      "데모용 분쟁: 외국인 손님이 시술 후 불만을 제기했고 환불을 요구했습니다. 운영팀 검토를 요청드립니다.",
  });

  // 5. API 정책 변경 알림 1건 (Epic 12.8 시연용 — admin 큐 1건 표시)
  await db.insert(apiPolicyAlerts).values({
    source: "meta-blog",
    title:
      "Instagram Graph API: messaging policy update (sample seed for demo)",
    link: "https://developers.facebook.com/blog/post/sample-policy-update",
    guid: "demo-seed-meta-2026-05-10",
    pubDate: new Date("2026-05-08T00:00:00Z"),
    status: "new",
  });

  console.log("[demo-seed] ✓ 시드 완료");
  console.log("");
  console.log("  데모 사장 user id  :", DEMO_USER_ID);
  console.log("  매장 #1 (사장 inbox):", autoStoreId);
  console.log("  매장 #2 (운영자 큐) :", reviewStoreId);
  console.log("  분쟁 #1            :", seededDisputeId);
  console.log("  API 정책 알림 #1   : meta-blog / demo-seed-meta-2026-05-10");
  console.log("");
  console.log("  사장 inbox     : http://localhost:4200/ko/store/inbox");
  console.log("  사장 예약      : http://localhost:4200/ko/store/bookings");
  console.log("  사장 대시보드  : http://localhost:4200/ko/store/dashboard");
  console.log("  사장 분쟁      : http://localhost:4200/ko/store/disputes");
  console.log(
    "  운영자 큐      : http://localhost:4200/ko/admin/store-verifications",
  );
  console.log("  운영자 분쟁 큐  : http://localhost:4200/ko/admin/disputes");
  console.log(
    "  API 정책 큐    : http://localhost:4200/ko/admin/api-policy-alerts",
  );
  console.log("");
  console.log("  다음: pnpm dev:demo");
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error("[demo-seed] 실패:", err);
    process.exit(1);
  });
