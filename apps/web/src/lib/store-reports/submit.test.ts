/**
 * E9-11 외부 신고 접수 helper 단위 테스트.
 *
 * helper는 DB 의존 (storeId 존재 검증 + INSERT). 단위 테스트는
 * StoreReportRepo mock으로 호출 인자 + 결과 union 검증.
 */
import { describe, expect, it } from "vitest";
import { submitStoreReport, type StoreReportRepo } from "./submit";

const VALID_STORE_ID = "11111111-1111-4111-8111-111111111111";
const VALID_REPORT_ID = "22222222-2222-4222-8222-222222222222";

function makeRepo(opts?: { storeExists?: boolean }) {
  const insertCalls: Array<{
    storeId: string;
    reporterType: string;
    reportReason: string;
    description: string;
    evidenceUrls?: string[];
  }> = [];
  const repo: StoreReportRepo = {
    storeExists: async () => opts?.storeExists ?? true,
    insertReport: async (input) => {
      insertCalls.push(input);
      return { id: VALID_REPORT_ID };
    },
  };
  return { repo, insertCalls };
}

describe("submitStoreReport", () => {
  it("정상 신고 → ok + repo.insertReport 호출 + reportId 반환", async () => {
    const { repo, insertCalls } = makeRepo();
    const result = await submitStoreReport({
      repo,
      storeId: VALID_STORE_ID,
      reporterType: "customer",
      reportReason: "illegal_service",
      description: "마사지 시술을 받았습니다. 의료법 위반 의심.",
      evidenceUrls: ["https://example.com/photo1.jpg"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.reportId).toBe(VALID_REPORT_ID);
      expect(result.storeId).toBe(VALID_STORE_ID);
    }
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0].reportReason).toBe("illegal_service");
  });

  it("description이 10자 미만 → invalid_input + insert 미호출", async () => {
    const { repo, insertCalls } = makeRepo();
    const result = await submitStoreReport({
      repo,
      storeId: VALID_STORE_ID,
      reporterType: "customer",
      reportReason: "fraud",
      description: "짧음",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
    }
    expect(insertCalls).toHaveLength(0);
  });

  it("storeId가 존재하지 않으면 store_not_found", async () => {
    const { repo, insertCalls } = makeRepo({ storeExists: false });
    const result = await submitStoreReport({
      repo,
      storeId: VALID_STORE_ID,
      reporterType: "competitor",
      reportReason: "safety_issue",
      description: "위생 상태가 매우 불량합니다 — 구체 사례 다수.",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("store_not_found");
    }
    expect(insertCalls).toHaveLength(0);
  });

  it("reporterType이 enum 밖 (지정 4개 외) → invalid_input", async () => {
    const { repo, insertCalls } = makeRepo();
    const result = await submitStoreReport({
      repo,
      storeId: VALID_STORE_ID,
      // 의도적으로 enum 밖 값 전달 — Zod safeParse가 reject
      reporterType: "owner" as never,
      reportReason: "fraud",
      description: "신고 내용 길게 충분히 — 10자 이상",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
    }
    expect(insertCalls).toHaveLength(0);
  });

  it("evidenceUrls 6개 (최대 5개 초과) → invalid_input", async () => {
    const { repo, insertCalls } = makeRepo();
    const result = await submitStoreReport({
      repo,
      storeId: VALID_STORE_ID,
      reporterType: "anonymous",
      reportReason: "other",
      description: "신고 내용 충분히 길게 작성합니다.",
      evidenceUrls: [
        "https://e.com/1",
        "https://e.com/2",
        "https://e.com/3",
        "https://e.com/4",
        "https://e.com/5",
        "https://e.com/6",
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
    }
    expect(insertCalls).toHaveLength(0);
  });
});
