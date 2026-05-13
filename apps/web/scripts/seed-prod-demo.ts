/**
 * Prod 외부 데모용 시드 (Plan v3 Cleanup Phase 2).
 *
 * `seed-beta-demo.ts`와 다른 점:
 *   - prod DB 전용 (DATABASE_URL guard로 명시 확인)
 *   - `resetDb()` **호출 안 함** — 기존 데이터 보존
 *   - deterministic UUID + `ON CONFLICT (id) DO NOTHING` → idempotent
 *     (재실행해도 prod 데이터 중복 X, 안전)
 *
 * 시드 대상 (services/staff는 기존 + 추가, 그 외는 신규):
 *   - Services 2건 추가 (글래스 스킨 / K-드라마 단발), 기존 3건 영문 번역 UPDATE
 *   - Staff 1명 추가 (Yuki), 기존 2명 portfolioUrls UPDATE
 *   - Customers 3명 (EN/JA/VN 국적 mix)
 *   - Conversations 3 + messages 7 (Instagram/Kakao/WhatsApp 채널 mix)
 *   - Bookings 5건 (status mix: scheduled 2 / completed 2 / no_show 1)
 *   - Store knowledge FAQ 5건 (영업시간 / 결제 / 외국어 / 주차 / 시술시간)
 *
 * 실행:
 *   DATABASE_URL="postgresql://...pooler.supabase.com..." \
 *   STORE_ID="02f0bf79-175f-4e24-b7cd-b83b3629c1e9" \
 *   pnpm --filter @hesya/database exec tsx ../../apps/web/scripts/seed-prod-demo.ts
 *
 * ⚠️ 안전:
 *   - DATABASE_URL이 `supabase.co` 또는 `pooler` 포함해야 통과 (로컬 DB 차단)
 *   - 보안 RED — Jayden 본인 환경에서만 실행
 */
import { and, eq, type DbClient } from "@hesya/database";
import {
  bookings,
  conversations,
  createDbClient,
  customers,
  messages,
  services,
  staff,
  storeKnowledge,
} from "@hesya/database";

const DATABASE_URL = process.env.DATABASE_URL;
const STORE_ID = process.env.STORE_ID ?? "02f0bf79-175f-4e24-b7cd-b83b3629c1e9";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL 환경변수 필수.");
}
if (!/supabase\.(co|com)/.test(DATABASE_URL)) {
  throw new Error(
    `DATABASE_URL이 Supabase URL 아님. prod 시드 전용. (받음: ${DATABASE_URL.slice(0, 40)}...)`,
  );
}
if (!/^[0-9a-f-]{36}$/.test(STORE_ID)) {
  throw new Error(`STORE_ID UUID 형식 아님: ${STORE_ID}`);
}

const db = createDbClient(DATABASE_URL);

const now = new Date();
const day = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d;
};
const at = (offset: number, hh: number, mm = 0) => {
  const d = day(offset);
  d.setHours(hh, mm, 0, 0);
  return d;
};

const ids = {
  service: {
    glassSkin: "00000010-0000-4000-8000-000000000011",
    kdramaBob: "00000010-0000-4000-8000-000000000012",
  },
  staff: { yuki: "00000020-0000-4000-8000-000000000021" },
  customer: {
    mei: "00000030-0000-4000-8000-000000000031",
    linh: "00000030-0000-4000-8000-000000000032",
    sarahDemo: "00000030-0000-4000-8000-000000000033",
  },
  conversation: {
    meiIg: "00000040-0000-4000-8000-000000000041",
    linhWa: "00000040-0000-4000-8000-000000000042",
    sarahKakao: "00000040-0000-4000-8000-000000000043",
  },
  message: {
    m1: "00000050-0000-4000-8000-000000000051",
    m2: "00000050-0000-4000-8000-000000000052",
    m3: "00000050-0000-4000-8000-000000000053",
    m4: "00000050-0000-4000-8000-000000000054",
    m5: "00000050-0000-4000-8000-000000000055",
    m6: "00000050-0000-4000-8000-000000000056",
    m7: "00000050-0000-4000-8000-000000000057",
  },
  booking: {
    b1: "00000060-0000-4000-8000-000000000061",
    b2: "00000060-0000-4000-8000-000000000062",
    b3: "00000060-0000-4000-8000-000000000063",
    b4: "00000060-0000-4000-8000-000000000064",
    b5: "00000060-0000-4000-8000-000000000065",
  },
  faq: {
    hours: "00000070-0000-4000-8000-000000000071",
    payment: "00000070-0000-4000-8000-000000000072",
    languages: "00000070-0000-4000-8000-000000000073",
    parking: "00000070-0000-4000-8000-000000000074",
    duration: "00000070-0000-4000-8000-000000000075",
  },
} as const;

async function seedServices(d: DbClient) {
  console.log("→ Services: 기존 3건 영문 번역 UPDATE + 신규 2건 추가");

  await d
    .update(services)
    .set({
      nameEn: "Basic Perm",
      nameJa: "ベーシックパーマ",
      nameZhCn: "基础烫发",
      nameVi: "Uốn cơ bản",
    })
    .where(
      and(eq(services.storeId, STORE_ID), eq(services.nameKo, "베이직 펌")),
    );
  await d
    .update(services)
    .set({
      nameEn: "Root Touch-up Color",
      nameJa: "リタッチカラー",
      nameZhCn: "补染发根",
      nameVi: "Nhuộm chân tóc",
    })
    .where(
      and(eq(services.storeId, STORE_ID), eq(services.nameKo, "뿌리 염색")),
    );
  await d
    .update(services)
    .set({
      nameEn: "Women's Cut",
      nameJa: "レディースカット",
      nameZhCn: "女士剪发",
      nameVi: "Cắt tóc nữ",
    })
    .where(
      and(eq(services.storeId, STORE_ID), eq(services.nameKo, "여성 커트")),
    );

  await d
    .insert(services)
    .values({
      id: ids.service.glassSkin,
      storeId: STORE_ID,
      nameKo: "글래스 스킨 케어",
      nameEn: "Glass Skin Care",
      nameJa: "ガラス肌ケア",
      nameZhCn: "玻璃肌护理",
      nameVi: "Chăm sóc da bóng",
      priceKrw: 90000,
      durationMinutes: 90,
      category: "skin_beauty",
    })
    .onConflictDoNothing();
  await d
    .insert(services)
    .values({
      id: ids.service.kdramaBob,
      storeId: STORE_ID,
      nameKo: "K-드라마 단발",
      nameEn: "K-Drama Short Cut",
      nameJa: "K-ドラマショートカット",
      nameZhCn: "K-剧短发",
      nameVi: "Tóc ngắn K-Drama",
      priceKrw: 65000,
      durationMinutes: 90,
      category: "hair_general",
    })
    .onConflictDoNothing();
}

async function seedStaff(d: DbClient) {
  console.log("→ Staff: 기존 2명 portfolioUrls UPDATE + 신규 1명 추가");

  const portfolioDavid = [
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600",
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600",
  ];
  const portfolioMinji = [
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600",
    "https://images.unsplash.com/photo-1546877625-cb8c71916608?w=600",
    "https://images.unsplash.com/photo-1610630917898-12f4d3a16b03?w=600",
  ];
  const portfolioYuki = [
    "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=600",
    "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600",
  ];

  await d
    .update(staff)
    .set({ portfolioUrls: portfolioDavid })
    .where(and(eq(staff.storeId, STORE_ID), eq(staff.name, "David")));
  await d
    .update(staff)
    .set({ portfolioUrls: portfolioMinji })
    .where(and(eq(staff.storeId, STORE_ID), eq(staff.name, "민지")));

  await d
    .insert(staff)
    .values({
      id: ids.staff.yuki,
      storeId: STORE_ID,
      name: "Yuki",
      languages: ["ko", "ja"],
      portfolioUrls: portfolioYuki,
      nonAsianWorks: false,
    })
    .onConflictDoNothing();
}

async function seedCustomers(d: DbClient) {
  console.log("→ Customers: 3명 (EN/JA/VN nationality mix)");

  await d
    .insert(customers)
    .values([
      {
        id: ids.customer.mei,
        name: "Mei Tanaka",
        channel: "instagram",
        externalId: "ig_mei_tanaka_demo",
        nationality: "JP",
        preferredLanguage: "ja",
        totalVisits: 2,
        ltvKrw: 150000,
        email: "mei.tanaka.demo@example.com",
      },
      {
        id: ids.customer.linh,
        name: "Linh Nguyen",
        channel: "whatsapp",
        externalId: "wa_linh_nguyen_demo",
        nationality: "VN",
        preferredLanguage: "vi",
        totalVisits: 1,
        ltvKrw: 35000,
        email: "linh.nguyen.demo@example.com",
      },
      {
        id: ids.customer.sarahDemo,
        name: "Sarah Park",
        channel: "kakao",
        externalId: "kakao_sarah_park_demo",
        nationality: "US",
        preferredLanguage: "en",
        totalVisits: 3,
        ltvKrw: 285000,
        allergyNote: "PPD 알러지 — 어두운 염색 시 사전 패치테스트 필요",
        preferredDesigner: "David",
        email: "sarah.park.demo@example.com",
      },
    ])
    .onConflictDoNothing();
}

async function seedConversationsAndMessages(d: DbClient) {
  console.log("→ Conversations 3 + messages 7 (채널 mix)");

  await d
    .insert(conversations)
    .values([
      {
        id: ids.conversation.meiIg,
        storeId: STORE_ID,
        customerId: ids.customer.mei,
        channel: "instagram",
        externalThreadId: "ig_thread_mei_demo",
        status: "open",
        lastInboundAt: new Date(now.getTime() - 1000 * 60 * 30),
        lastMessageAt: new Date(now.getTime() - 1000 * 60 * 30),
        lastMessagePreview:
          "글래스 스킨 케어 받고 싶어요 / I'd like glass skin care",
        unreadCount: 1,
      },
      {
        id: ids.conversation.linhWa,
        storeId: STORE_ID,
        customerId: ids.customer.linh,
        channel: "whatsapp",
        externalThreadId: "wa_thread_linh_demo",
        status: "open",
        lastInboundAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        lastMessageAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        lastMessagePreview: "내일 예약 가능한가요? / Booking tomorrow?",
        unreadCount: 0,
      },
      {
        id: ids.conversation.sarahKakao,
        storeId: STORE_ID,
        customerId: ids.customer.sarahDemo,
        channel: "kakao",
        externalThreadId: "kakao_thread_sarah_demo",
        status: "open",
        lastInboundAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        lastMessageAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
        lastMessagePreview: "지난번 펌 너무 마음에 들었어요!",
        unreadCount: 0,
      },
    ])
    .onConflictDoNothing();

  await d
    .insert(messages)
    .values([
      {
        id: ids.message.m1,
        conversationId: ids.conversation.meiIg,
        storeId: STORE_ID,
        customerId: ids.customer.mei,
        direction: "inbound",
        channel: "instagram",
        originalText: "こんにちは!グラススキンケアを受けたいです",
        translatedText: "안녕하세요! 글래스 스킨 케어 받고 싶어요",
        status: "received",
        createdAt: new Date(now.getTime() - 1000 * 60 * 35),
      },
      {
        id: ids.message.m2,
        conversationId: ids.conversation.meiIg,
        storeId: STORE_ID,
        customerId: ids.customer.mei,
        direction: "outbound",
        channel: "instagram",
        originalText:
          "안녕하세요 Mei님! 글래스 스킨 케어는 90분 ₩90,000입니다. 이번 주 토요일 14:00 가능하실까요?",
        translatedText:
          "こんにちは Meiさん!ガラス肌ケアは90分 ₩90,000です。今週土曜日14:00はいかがでしょうか?",
        status: "pending_review",
        createdAt: new Date(now.getTime() - 1000 * 60 * 30),
      },
      {
        id: ids.message.m3,
        conversationId: ids.conversation.linhWa,
        storeId: STORE_ID,
        customerId: ids.customer.linh,
        direction: "inbound",
        channel: "whatsapp",
        originalText: "Xin chào! Có thể đặt lịch ngày mai không?",
        translatedText: "안녕하세요! 내일 예약 가능한가요?",
        status: "received",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2 - 1000 * 60 * 5),
      },
      {
        id: ids.message.m4,
        conversationId: ids.conversation.linhWa,
        storeId: STORE_ID,
        customerId: ids.customer.linh,
        direction: "outbound",
        channel: "whatsapp",
        originalText:
          "안녕하세요 Linh님! 내일 가능한 시간을 알려드릴게요. 어떤 시술 원하시나요?",
        translatedText:
          "Xin chào Linh! Để tôi báo các khung giờ ngày mai. Bạn muốn dịch vụ nào?",
        status: "sent",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2),
      },
      {
        id: ids.message.m5,
        conversationId: ids.conversation.linhWa,
        storeId: STORE_ID,
        customerId: ids.customer.linh,
        direction: "inbound",
        channel: "whatsapp",
        originalText: "Cắt tóc nữ ạ. 15:00 được không?",
        translatedText: "여성 커트요. 15:00 가능한가요?",
        status: "received",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2 + 1000 * 60),
      },
      {
        id: ids.message.m6,
        conversationId: ids.conversation.sarahKakao,
        storeId: STORE_ID,
        customerId: ids.customer.sarahDemo,
        direction: "inbound",
        channel: "kakao",
        originalText: "지난번 펌 너무 마음에 들었어요! 다음 달에 또 갈게요 :)",
        translatedText: null,
        status: "received",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
      },
      {
        id: ids.message.m7,
        conversationId: ids.conversation.sarahKakao,
        storeId: STORE_ID,
        customerId: ids.customer.sarahDemo,
        direction: "outbound",
        channel: "kakao",
        originalText:
          "Sarah님 감사합니다! 다음 방문 시 PPD 알러지 메모 확인해서 안전한 색상으로 준비할게요.",
        translatedText:
          "Thanks Sarah! I noted your PPD allergy — we'll prepare safe color options for your next visit.",
        status: "sent",
        createdAt: new Date(
          now.getTime() - 1000 * 60 * 60 * 24 + 1000 * 60 * 10,
        ),
      },
    ])
    .onConflictDoNothing();
}

async function seedBookings(d: DbClient) {
  console.log("→ Bookings 5 (status mix)");

  await d
    .insert(bookings)
    .values([
      {
        id: ids.booking.b1,
        storeId: STORE_ID,
        customerId: ids.customer.mei,
        serviceId: ids.service.glassSkin,
        scheduledAt: at(2, 14, 0),
        status: "scheduled",
        totalPriceKrw: 90000,
        depositPaidKrw: 27000,
        paymentMethod: "mock_card",
      },
      {
        id: ids.booking.b2,
        storeId: STORE_ID,
        customerId: ids.customer.sarahDemo,
        serviceId: ids.service.kdramaBob,
        scheduledAt: at(5, 11, 30),
        status: "scheduled",
        totalPriceKrw: 65000,
        depositPaidKrw: 19500,
        paymentMethod: "mock_alipay",
      },
      {
        id: ids.booking.b3,
        storeId: STORE_ID,
        customerId: ids.customer.sarahDemo,
        serviceId: ids.service.glassSkin,
        scheduledAt: at(-14, 15, 0),
        status: "completed",
        totalPriceKrw: 120000,
        depositPaidKrw: 36000,
        paymentMethod: "mock_card",
      },
      {
        id: ids.booking.b4,
        storeId: STORE_ID,
        customerId: ids.customer.mei,
        serviceId: ids.service.glassSkin,
        scheduledAt: at(-7, 16, 0),
        status: "completed",
        totalPriceKrw: 90000,
        depositPaidKrw: 27000,
        paymentMethod: "mock_line_pay",
      },
      {
        id: ids.booking.b5,
        storeId: STORE_ID,
        customerId: ids.customer.linh,
        serviceId: ids.service.kdramaBob,
        scheduledAt: at(-3, 15, 0),
        status: "no_show",
        totalPriceKrw: 35000,
        depositPaidKrw: 10500,
        paymentMethod: "mock_card",
      },
    ])
    .onConflictDoNothing();

  // 첫 prod seed에서 b3/b4가 serviceId 없이 들어가 bookings UI "—" 표시.
  // onConflictDoNothing → 위 INSERT는 no-op이므로 명시 UPDATE로 백필.
  await d
    .update(bookings)
    .set({ serviceId: ids.service.glassSkin })
    .where(eq(bookings.id, ids.booking.b3));
  await d
    .update(bookings)
    .set({ serviceId: ids.service.glassSkin })
    .where(eq(bookings.id, ids.booking.b4));
  await d
    .update(bookings)
    .set({ serviceId: ids.service.kdramaBob })
    .where(eq(bookings.id, ids.booking.b5));
}

async function seedStoreKnowledge(d: DbClient) {
  console.log("→ Store knowledge FAQ 5");

  await d
    .insert(storeKnowledge)
    .values([
      {
        id: ids.faq.hours,
        storeId: STORE_ID,
        question: "영업시간이 어떻게 되나요? / What are your business hours?",
        answer:
          "월~토 10:00~20:00, 일요일 휴무입니다. (Mon-Sat 10AM-8PM, closed Sun)",
      },
      {
        id: ids.faq.payment,
        storeId: STORE_ID,
        question:
          "어떤 결제 수단을 받나요? / Which payment methods do you accept?",
        answer:
          "현금, 신용카드, Alipay+, LINE Pay를 받습니다. 외국인 카드도 가능합니다. (Cash, Credit, Alipay+, LINE Pay — foreign cards accepted)",
      },
      {
        id: ids.faq.languages,
        storeId: STORE_ID,
        question: "어떤 언어로 응대하나요? / Which languages do you speak?",
        answer:
          "한국어/영어/일본어로 응대합니다. 중국어·베트남어는 AI 번역으로 도와드려요. (KO/EN/JA in-person; CN/VN via AI translation)",
      },
      {
        id: ids.faq.parking,
        storeId: STORE_ID,
        question: "주차 가능한가요? / Is parking available?",
        answer:
          "건물 지하 1~3층 주차장 2시간 무료입니다. (2 hours free parking in basement levels)",
      },
      {
        id: ids.faq.duration,
        storeId: STORE_ID,
        question:
          "시술 시간이 얼마나 걸리나요? / How long does treatment take?",
        answer:
          "커트 60분, 염색 90~120분, 펌 180분 정도 소요됩니다. (Cut 60min / Color 90-120min / Perm ~180min)",
      },
    ])
    .onConflictDoNothing();
}

async function main() {
  // 비밀번호 마스킹 — 보안 RED 프로젝트, 터미널 스크롤백 + CI 로그 노출 차단.
  const masked = DATABASE_URL!.replace(/:[^:@]+@/, ":***@");
  console.log(`Seeding prod demo for storeId=${STORE_ID}`);
  console.log(`Using DATABASE_URL=${masked}\n`);

  await seedServices(db);
  await seedStaff(db);
  await seedCustomers(db);
  await seedConversationsAndMessages(db);
  await seedBookings(db);
  await seedStoreKnowledge(db);

  console.log("\n✅ Done. 재실행해도 idempotent (ON CONFLICT DO NOTHING).");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
