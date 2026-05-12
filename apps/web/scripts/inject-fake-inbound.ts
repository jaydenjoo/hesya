/**
 * Plan v3 M4.x (소형) — 시연 중 가짜 IG inbound 메시지 1건 자동 발송.
 *
 * 사장이 `pnpm dev:demo` 켜고 inbox 보고 있을 때 이 script 호출하면 새
 * conversation + inbound + pending_review draft가 추가됨. inbox poll(5s)이
 * 자동으로 잡아 사장 UI에 새 thread + 빨간 dot 표시.
 *
 * 5개 fixture 중 random 1개 선택 (en/ja/zh-CN/zh-TW/vi). 매 호출마다 unique
 * externalId(`fake_<timestamp>`)로 새 customer 생성 — 호출 반복 가능, inbox에
 * 누적.
 *
 * 실행:
 *   pnpm inject:fake-inbound
 *
 * 전제: seed:demo 1회 실행 완료 + DEMO_USER_ID의 매장 1개 존재.
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../.env.local") });

import { conversations, customers, eq, storeOwners } from "@hesya/database";

import {
  createTestDb,
  seedConversation,
  seedCustomer,
  seedMessage,
} from "../e2e/fixtures/db";

interface FakeMessage {
  readonly language: "en" | "ja" | "zh-CN" | "zh-TW" | "vi";
  readonly foreign: string;
  readonly korean: string;
  readonly draft: { korean: string; foreign: string };
}

const FIXTURES: FakeMessage[] = [
  {
    language: "en",
    foreign:
      "Hi! I'm visiting Seoul next weekend. Do you accept walk-ins on Saturday afternoon?",
    korean:
      "안녕하세요! 다음 주말 서울 방문 예정이에요. 토요일 오후 워크인 가능한가요?",
    draft: {
      korean:
        "안녕하세요! 토요일 오후는 예약 손님이 많아 워크인은 어렵습니다. 미리 예약 도와드릴까요?",
      foreign:
        "Hello! Saturday afternoon is fully booked with reservations. Would you like me to help you book a slot in advance?",
    },
  },
  {
    language: "ja",
    foreign:
      "こんにちは!ヘッドスパとカットのセットメニューはありますか?所要時間も教えてください。",
    korean:
      "안녕하세요! 두피 케어 + 커트 세트 메뉴 있나요? 소요 시간도 알려주세요.",
    draft: {
      korean:
        "안녕하세요! 두피 케어 + 커트 세트는 105,000원이며 약 100분 소요됩니다. 예약 도와드릴까요?",
      foreign:
        "こんにちは!ヘッドスパ+カットのセットは105,000ウォン、約100分です。ご予約をお取りしましょうか?",
    },
  },
  {
    language: "zh-CN",
    foreign:
      "你好,我对染发剂过敏(对PPD过敏)。请问你们有无氨/无PPD的染发产品吗?",
    korean:
      "안녕하세요, 염색약 알러지(PPD 알러지)가 있어요. 무암모니아/PPD-free 염색약 있나요?",
    draft: {
      korean:
        "안녕하세요! 무암모니아 + PPD-free 염색약 가능합니다. 패치 테스트 24시간 전에 예약 추천드려요.",
      foreign:
        "您好!我们提供无氨且PPD-free的染发产品。建议提前24小时做皮肤测试,需要的话我帮您预约时间。",
    },
  },
  {
    language: "zh-TW",
    foreign: "您好!請問可以用Apple Pay付款嗎?另外有沒有會說中文的設計師?",
    korean:
      "안녕하세요! Apple Pay 결제 가능한가요? 그리고 중국어 가능한 디자이너 있나요?",
    draft: {
      korean:
        "안녕하세요! Apple Pay 사용 가능합니다. 중국어 가능한 디자이너 B 추천드려요. 예약 도와드릴까요?",
      foreign:
        "您好!Apple Pay 可以使用。我推薦會說中文的設計師B,需要我幫您預約嗎?",
    },
  },
  {
    language: "vi",
    foreign:
      "Xin chào! Tôi muốn nhuộm tóc màu nâu sáng. Giá khoảng bao nhiêu và cần đặt trước bao lâu?",
    korean:
      "안녕하세요! 밝은 갈색으로 염색하고 싶어요. 가격은 얼마이고 며칠 전에 예약해야 하나요?",
    draft: {
      korean:
        "안녕하세요! 밝은 갈색 염색은 95,000원이며 약 2시간 소요됩니다. 주말은 3~4일 전 예약 권장드려요.",
      foreign:
        "Xin chào! Nhuộm màu nâu sáng là 95,000 KRW, mất khoảng 2 tiếng. Cuối tuần nên đặt trước 3-4 ngày.",
    },
  },
];

async function main(): Promise<void> {
  const db = createTestDb();

  // 사장 1명의 매장 ID 자동 탐색 (seed:demo가 storeOwner 1건 시드)
  const owners = await db
    .select({ storeId: storeOwners.storeId })
    .from(storeOwners)
    .limit(1);
  const storeId = owners[0]?.storeId;
  if (!storeId) {
    console.error(
      "[fake-inbound] ✗ storeOwners 행이 없습니다. 먼저 `pnpm seed:demo` 실행하세요.",
    );
    process.exit(1);
  }

  const fixtureIndex = Math.floor(Math.random() * FIXTURES.length);
  const f = FIXTURES[fixtureIndex];
  if (!f) throw new Error("fixture pick failed");

  const externalId = `fake_${f.language}_${Date.now()}`;
  const customerId = await seedCustomer(db, {
    channel: "instagram",
    externalId,
  });
  // preferredLanguage 컬럼 채우기 — inbox UI lang chip + 다국어 표시용
  await db
    .update(customers)
    .set({ preferredLanguage: f.language, name: `Demo ${f.language}` })
    .where(eq(customers.id, customerId));

  const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
  const now = new Date();
  const convId = await seedConversation(db, {
    storeId,
    customerId,
    channel: "instagram",
    externalThreadId: `thread_${externalId}`,
    messagingWindowExpiresAt: expiresAt,
    lastInboundAt: now,
  });

  await seedMessage(db, {
    conversationId: convId,
    customerId,
    storeId,
    direction: "inbound",
    text: f.foreign,
    translatedText: f.korean,
  });

  await seedMessage(db, {
    conversationId: convId,
    customerId,
    storeId,
    direction: "outbound",
    text: f.draft.korean,
    translatedText: f.draft.foreign,
    status: "ai_draft",
    draftStatus: "pending_review",
  });

  await db
    .update(conversations)
    .set({
      lastMessagePreview: f.draft.korean,
      lastMessageAt: now,
    })
    .where(eq(conversations.id, convId));

  console.log(`[fake-inbound] ✓ ${f.language.toUpperCase()} 메시지 1건 추가`);
  console.log(`  customerId      : ${customerId}`);
  console.log(`  conversationId  : ${convId}`);
  console.log(`  externalId      : ${externalId}`);
  console.log(`  inbound (외국어): ${f.foreign.slice(0, 60)}...`);
  console.log(`  inbound (한국어): ${f.korean.slice(0, 60)}...`);
  console.log("");
  console.log("  → 5초 내 inbox poll이 새 thread 표시");
  console.log("  → http://localhost:4200/ko/store/inbox");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[fake-inbound] ✗ 실패:", err);
    process.exit(1);
  });
