/**
 * Plan v4 Epic B — AI Photo Analysis (Claude Opus 4.7 Vision).
 *
 * 외국인 손님이 업로드한 헤어/메이크업 사진을 분석:
 *   - styleName: 인식된 스타일 (예: "Korean layered bob with curtain bangs")
 *   - difficulty: easy / medium / hard
 *   - estimatedMinutes: 예상 시술 시간 (분)
 *   - compatibilityNote: 모발/피부 호환성 노트
 *   - confidence: 0~1
 *
 * 비용: ~$0.015/회 (PRD §1028 KYC Vision 기준 동일).
 * env import lazy (L-035 패턴, anthropic-vision-repo.ts와 동일).
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `당신은 K-beauty 헤어·메이크업 스타일 전문가입니다. 외국인 손님이 한국 미용실에서 따라하고 싶어 업로드한 사진을 분석합니다.

추출 필드:
- styleName: 스타일 이름 (영문, 예: "Korean layered bob with face-framing curtain bangs")
- difficulty: "easy" | "medium" | "hard"
  - easy: 1시간 이내, 일반 디자이너 가능
  - medium: 1.5~2.5시간, 경력 디자이너 권장
  - hard: 3시간+, 컬러/펌 동반, 전문 디자이너 필수
- estimatedMinutes: 예상 시술 시간 (정수, 분)
- compatibilityNote: 모발 텍스처/길이/피부톤 호환성 한 문장 영문 노트 (예: "Works best on fine straight hair, may need extra prep for thick wavy hair")
- confidence: 0~1 (사진 흐림/부분 가림 등으로 자신 없으면 0.7 이하)

응답 형식 (JSON only, 다른 텍스트 X):
{"styleName":"<영문>","difficulty":"easy|medium|hard","estimatedMinutes":<정수>,"compatibilityNote":"<영문>","confidence":<0.0~1.0>}`;

const USER_PROMPT =
  "이 사진의 헤어/메이크업 스타일을 분석하고 한국 미용실에서 시술 가능 여부를 평가해주세요.";

const visionResultSchema = z.object({
  styleName: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimatedMinutes: z.number().int().min(15).max(360),
  compatibilityNote: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1),
});

export type VisionAnalysisResult = z.infer<typeof visionResultSchema>;

function parseResponse(text: string): VisionAnalysisResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new Error(`invalid JSON from Vision: ${text.slice(0, 200)}`);
  }
  const result = visionResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `invalid Vision response shape: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return result.data;
}

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require("@/shared/config/env");
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}

export interface AnalyzePhotoInput {
  readonly imageBase64: string;
  readonly mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

export async function analyzePhotoStyle(
  input: AnalyzePhotoInput,
): Promise<VisionAnalysisResult> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: input.mediaType,
              data: input.imageBase64,
            },
          },
          { type: "text", text: USER_PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("invalid Vision response: text block 없음");
  }
  return parseResponse(textBlock.text);
}

// 외부 테스트용
export const __test = { parseResponse, SYSTEM_PROMPT, MODEL };
