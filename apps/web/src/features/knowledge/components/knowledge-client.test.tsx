import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../actions/manage-faq", () => ({
  createFAQ: vi.fn(),
  updateFAQ: vi.fn(),
  deleteFAQ: vi.fn(),
}));

import { KnowledgeClient, type FAQItem } from "./knowledge-client";

const baseFAQ: FAQItem = {
  id: "11111111-1111-4111-8111-111111111111",
  question: "단발 가능?",
  answer: "네 가능합니다 (5만원)",
  hasEmbedding: true,
  updatedAt: new Date(),
};

describe("KnowledgeClient (B-4c)", () => {
  it("빈 상태 → '+ FAQ 추가' 버튼 + 빈 안내 메시지", () => {
    render(<KnowledgeClient initialFAQs={[]} maxFAQs={200} />);
    expect(
      screen.getByRole("button", { name: /\+ FAQ 추가/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/아직 등록된 FAQ가 없습니다/)).toBeInTheDocument();
  });

  it("stats strip: 등록 FAQ + 잔여 슬롯 표시 (0건 / max 200)", () => {
    render(<KnowledgeClient initialFAQs={[]} maxFAQs={200} />);
    expect(screen.getByText("등록 FAQ")).toBeInTheDocument();
    expect(screen.getByText("/ 200")).toBeInTheDocument();
    expect(screen.getByText("잔여 슬롯")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("FAQ 있음 → 질문/답변 + 수정/삭제 버튼 표시", () => {
    render(<KnowledgeClient initialFAQs={[baseFAQ]} maxFAQs={200} />);
    expect(screen.getByText(/단발 가능\?/)).toBeInTheDocument();
    expect(screen.getByText(/네 가능합니다/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "수정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "삭제" })).toBeInTheDocument();
  });

  it("hasEmbedding=false → '임베딩 미생성' 경고 표시", () => {
    render(
      <KnowledgeClient
        initialFAQs={[{ ...baseFAQ, hasEmbedding: false }]}
        maxFAQs={200}
      />,
    );
    expect(screen.getByText(/임베딩 미생성/)).toBeInTheDocument();
  });

  it("count 한도 도달 → '+ FAQ 추가' 버튼 미표시", () => {
    const fullList = Array.from({ length: 200 }, (_, i) => ({
      ...baseFAQ,
      id: `${i}`,
    }));
    render(<KnowledgeClient initialFAQs={fullList} maxFAQs={200} />);
    expect(
      screen.queryByRole("button", { name: /\+ FAQ 추가/ }),
    ).not.toBeInTheDocument();
  });
});
