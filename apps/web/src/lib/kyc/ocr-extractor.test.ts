/**
 * E9-6 영업신고증 OCR helper 단위 테스트.
 *
 * helper는 Vision API 호출자 (외부 의존). 단위 테스트는 VisionExtractorRepo mock으로
 * 입력→출력 매핑 + confidence 임계값 + invalid 응답 처리를 검증.
 *
 * 실 Vision 정확도는 manual smoke로 검증 (E9-3·E9-4·E9-9·E9-12 동일 정책).
 */
import { describe, expect, it } from "vitest";
import {
  extractOcrFromLicense,
  type VisionExtractorRepo,
} from "./ocr-extractor";
import type { OcrExtractResult } from "@hesya/shared-types";

function makeRepo(
  responses: Array<OcrExtractResult | "invalid_response" | Error>,
) {
  let i = 0;
  const calls: Array<{ imageBase64: string; mediaType: string }> = [];
  const repo: VisionExtractorRepo = {
    extract: async (input) => {
      calls.push(input);
      const r = responses[i++];
      if (r instanceof Error) throw r;
      if (r === "invalid_response") {
        throw new Error("invalid JSON from Vision: not parseable");
      }
      return r;
    },
  };
  return { repo, calls };
}

describe("extractOcrFromLicense", () => {
  it("4개 필드 정상 추출 (high confidence) → ok + autoExtracted=true", async () => {
    const { repo } = makeRepo([
      {
        extracted: {
          businessNumber: "1234567890",
          representativeName: "홍길동",
          address: "서울특별시 강남구 청담동 123-4",
          startDate: "2020-03-15",
        },
        confidence: 0.93,
      },
    ]);
    const result = await extractOcrFromLicense({
      repo,
      input: { imageBase64: "abc==", mediaType: "image/jpeg" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extracted.businessNumber).toBe("1234567890");
      expect(result.extracted.representativeName).toBe("홍길동");
      expect(result.confidence).toBe(0.93);
      expect(result.autoExtracted).toBe(true);
    }
  });

  it("일부 필드 null + low confidence (< 0.85) → ok + autoExtracted=false", async () => {
    const { repo } = makeRepo([
      {
        extracted: {
          businessNumber: "1234567890",
          representativeName: null,
          address: "서울 강남구",
          startDate: null,
        },
        confidence: 0.62,
      },
    ]);
    const result = await extractOcrFromLicense({
      repo,
      input: { imageBase64: "blurred==", mediaType: "image/png" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.extracted.representativeName).toBeNull();
      expect(result.extracted.startDate).toBeNull();
      expect(result.autoExtracted).toBe(false);
    }
  });

  it("Vision API invalid JSON 응답 → ok=false (vision_invalid_response)", async () => {
    const { repo } = makeRepo(["invalid_response"]);
    const result = await extractOcrFromLicense({
      repo,
      input: { imageBase64: "abc==", mediaType: "image/jpeg" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("vision_invalid_response");
    }
  });

  it("Vision API throw 일반 Error → ok=false (vision_error)", async () => {
    const { repo } = makeRepo([new Error("Anthropic 503 Service Unavailable")]);
    const result = await extractOcrFromLicense({
      repo,
      input: { imageBase64: "abc==", mediaType: "image/jpeg" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("vision_error");
      expect(result.message).toContain("Anthropic 503");
    }
  });

  it("imageBase64 빈 문자열 → invalid_input + repo 미호출", async () => {
    const { repo, calls } = makeRepo([
      {
        extracted: {
          businessNumber: "1234567890",
          representativeName: "홍길동",
          address: "서울",
          startDate: "2020-01-01",
        },
        confidence: 0.9,
      },
    ]);
    const result = await extractOcrFromLicense({
      repo,
      input: { imageBase64: "", mediaType: "image/jpeg" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
    }
    expect(calls).toHaveLength(0);
  });

  it("미지원 mediaType (image/bmp) → invalid_input + repo 미호출", async () => {
    const { repo, calls } = makeRepo([
      {
        extracted: {
          businessNumber: "1234567890",
          representativeName: "홍길동",
          address: "서울",
          startDate: "2020-01-01",
        },
        confidence: 0.9,
      },
    ]);
    const result = await extractOcrFromLicense({
      repo,
      // @ts-expect-error — 런타임 invalid_input 분기 검증 (z.enum 차단)
      input: { imageBase64: "abc==", mediaType: "image/bmp" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
      expect(result.message).toContain("mediaType");
    }
    expect(calls).toHaveLength(0);
  });

  it("confidence 정확히 0.85 (경계값) → autoExtracted=true", async () => {
    const { repo } = makeRepo([
      {
        extracted: {
          businessNumber: "1234567890",
          representativeName: "홍길동",
          address: "서울",
          startDate: "2020-01-01",
        },
        confidence: 0.85,
      },
    ]);
    const result = await extractOcrFromLicense({
      repo,
      input: { imageBase64: "abc==", mediaType: "image/jpeg" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.confidence).toBe(0.85);
      expect(result.autoExtracted).toBe(true);
    }
  });
});
