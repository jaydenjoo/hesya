/**
 * Sprint 2A PR-A2 — Customer Chat mock conversation fixtures.
 *
 * Reference: `docs/design/reference/chat-app.jsx` SEED_MESSAGES.
 * 사장(KR) ↔ 외국인 손님(EN) 다국어 채팅 시나리오 — 양방향 자동 번역 + 신뢰도 표시.
 *
 * 3 메시지 타입: text / image / voice. 텍스트에는 confidence (confident/ambiguous)
 * 표시 — globe icon 탭하면 audit sheet에서 원문·번역·신뢰도 모달.
 */

export type ChatMessageFrom = "salon" | "user";
export type ChatLangDirection = "ko→en" | "en→ko" | "ko→ja" | "ja→ko";

interface ChatBase {
  readonly id: string;
  readonly from: ChatMessageFrom;
  readonly time: string; // HH:MM (24h)
}

export interface ChatTextMessage extends ChatBase {
  readonly type: "text";
  /** 사장 측 원문 (한국어). */
  readonly kr?: string;
  /** 손님 측 원문 (외국어). */
  readonly src?: string;
  /** 자동 번역 결과 (사장→손님 언어 또는 손님→사장 언어). */
  readonly tr: string;
  readonly confidence: "confident" | "ambiguous";
  readonly note?: string;
  readonly lang: ChatLangDirection;
}

export interface ChatImageMessage extends ChatBase {
  readonly type: "image";
  readonly caption: string;
  readonly tr: string;
}

export interface ChatVoiceMessage extends ChatBase {
  readonly type: "voice";
  readonly duration: string; // M:SS
  readonly transcript: string; // 원문 음성 → text
  readonly tr: string; // 손님 언어로 번역
}

export type ChatMessage = ChatTextMessage | ChatImageMessage | ChatVoiceMessage;

export const mockChatStore = {
  name: "Stylista — Hongdae",
  initial: "S",
  status: "online",
  responseTime: "~3 min",
} as const;

export const mockChatDay = "Today · 4월 15일";

export const mockChatMessages: ReadonlyArray<ChatMessage> = [
  {
    id: "m1",
    type: "text",
    from: "salon",
    time: "13:42",
    kr: "안녕하세요, 사쿠라님! 예약 확인됐어요. 오시는 길에 궁금한 거 있으시면 편하게 물어보세요 😊",
    tr: "Hi Sakura! Your booking is confirmed. Feel free to ask anything on the way 😊",
    confidence: "confident",
    lang: "ko→en",
  },
  {
    id: "m2",
    type: "text",
    from: "salon",
    time: "13:42",
    kr: "혹시 원하시는 헤어 스타일 사진 있으시면 미리 보내주셔도 좋아요!",
    tr: "If you have a reference photo of the style you'd like, feel free to send it ahead!",
    confidence: "confident",
    lang: "ko→en",
  },
  {
    id: "m3",
    type: "text",
    from: "user",
    time: "13:48",
    src: "Hi! Yes, I have one. Can the layered cut work for thin hair?",
    tr: "안녕하세요! 네, 한 장 있어요. 얇은 머리에도 레이어드 컷이 어울릴까요?",
    confidence: "confident",
    lang: "en→ko",
  },
  {
    id: "m4",
    type: "image",
    from: "user",
    time: "13:48",
    caption: "Reference photo",
    tr: "참고 사진",
  },
  {
    id: "m5",
    type: "text",
    from: "salon",
    time: "13:51",
    kr: "사진 너무 잘 어울리실 것 같아요! 얇은 머리에 풍성한 느낌 살리는 게 저희 강점이에요. 트리트먼트도 같이 하시는 거 추천드려요.",
    tr: "The photo will suit you so well! Adding volume to fine hair is our strength. I'd recommend the treatment alongside.",
    confidence: "ambiguous",
    note: "Verb tense ambiguous in Korean — original shown above.",
    lang: "ko→en",
  },
  {
    id: "m6",
    type: "voice",
    from: "salon",
    time: "13:52",
    duration: "0:12",
    transcript:
      "참, 매장 도착하시면 인박스로 한 번만 알려주세요. 입구를 못 찾으시는 분들이 가끔 계셔서요.",
    tr: "Oh, when you arrive please ping me on chat once — some guests have trouble finding the entrance.",
  },
];

/** Empty state 시연용 opener pill 텍스트 (영어 — 기본). */
export const mockChatOpeners: ReadonlyArray<string> = [
  "Hi, I just booked!",
  "Can I bring a reference photo?",
  "Where is your salon?",
];
