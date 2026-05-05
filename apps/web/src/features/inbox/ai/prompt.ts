/**
 * Phase B-1 — 인박스 AI 응답 프롬프트 빌더.
 *
 * 사장 검수용 한국어 답변 초안을 만들기 위한 system + messages 페어.
 * Anthropic SDK의 `messages.create({ system, messages })` 시그니처에 그대로 투입 가능.
 *
 * 자동 번역(Phase B-3)은 별도 — 본 모듈은 항상 한국어 초안만 생성.
 */

export type CustomerLanguage = "ko" | "en" | "zh" | "ja" | "vi";

export type PromptDirection = "inbound" | "outbound";

export type BuildPromptInput = {
  storeName: string;
  customerLanguage: CustomerLanguage;
  recentMessages: Array<{ direction: PromptDirection; text: string }>;
};

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string;
};

export type BuildPromptOutput = {
  system: string;
  messages: AnthropicMessage[];
};

const LANGUAGE_LABEL: Record<CustomerLanguage, string> = {
  ko: "한국어 (Korean)",
  en: "영어 (English)",
  zh: "중국어 (Chinese)",
  ja: "일본어 (Japanese)",
  vi: "베트남어 (Vietnamese)",
};

export function buildPrompt(input: BuildPromptInput): BuildPromptOutput {
  const langLabel = LANGUAGE_LABEL[input.customerLanguage];
  const system = `당신은 한국 매장 "${input.storeName}"의 사장님 응대 비서다. 고객 언어: ${langLabel}.

규칙:
- 반드시 **한국어**로 답변 초안을 작성한다 (사장님 검수 후 자동 번역됨).
- 짧고 친절하게, 2~4문장 이내.
- 매장 정보가 부족하면 "확인 후 답장 드리겠습니다"로 마무리.
- 의료적·법적 단정 금지 (예: "효과 보장", "100% 안전").
- 가격·일정 등 매장이 결정해야 하는 값은 임의로 만들지 않는다.`;

  const messages: AnthropicMessage[] = input.recentMessages.map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    content: m.text,
  }));

  return { system, messages };
}
