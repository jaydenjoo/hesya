"use client";

import { Editor, type JSONContent } from "@hesya/shared-ui";
import { useState } from "react";

const filledEnglish: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "About this salon" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "We welcome travellers from around the world. Our designers speak ",
        },
        { type: "text", marks: [{ type: "bold" }], text: "English, Japanese" },
        { type: "text", text: ", and basic Mandarin." },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Cut & blow dry — 90 min" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Magic straightening — 4 hours" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const filledKorean: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "매장 소개" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "외국인 손님이 안심하고 방문할 수 있는 살롱입니다. 한글 본문은 ",
        },
        {
          type: "text",
          marks: [{ type: "italic" }],
          text: "word-break: keep-all",
        },
        { type: "text", text: " 적용으로 어절 단위 줄바꿈이 됩니다." },
      ],
    },
    {
      type: "blockquote",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "정부 인증 매장 — KYC 통과 후 골드 배지 표시.",
            },
          ],
        },
      ],
    },
  ],
};

export default function EditorPreviewPage() {
  const [empty, setEmpty] = useState<JSONContent | null>(null);
  const [withPlaceholder, setWithPlaceholder] = useState<JSONContent | null>(
    null,
  );
  const [withContent, setWithContent] = useState<JSONContent>(filledEnglish);
  const [withKorean, setWithKorean] = useState<JSONContent>(filledKorean);

  return (
    <main className="mx-auto max-w-3xl space-y-10 p-8">
      <header>
        <h1 className="text-2xl font-semibold">S-21 Tiptap Editor — preview</h1>
        <p className="mt-2 text-sm text-zinc-600">
          DECISIONS § 1.4 의 콘텐츠 에디터(StarterKit + Placeholder + Link).
          출력은 ProseMirror JSON. 4가지 변형으로 시각·인터랙션 회귀를
          검증합니다.
        </p>
      </header>

      <Variant
        label="1. Empty (no placeholder)"
        helper="가장 단순한 형태. 클릭 후 타이핑."
      >
        <Editor onChange={setEmpty} />
        <JsonPreview value={empty} />
      </Variant>

      <Variant
        label="2. With placeholder"
        helper="비어있을 때 안내 문구. 첫 타이핑 시 사라짐."
      >
        <Editor
          placeholder="Write your store description in any language…"
          onChange={setWithPlaceholder}
        />
        <JsonPreview value={withPlaceholder} />
      </Variant>

      <Variant
        label="3. Pre-filled (English)"
        helper="JSONContent 객체로 초기값 주입. 헤딩·볼드·리스트 동작."
      >
        <Editor initialContent={filledEnglish} onChange={setWithContent} />
        <JsonPreview value={withContent} />
      </Variant>

      <Variant
        label="4. Pre-filled (한글 본문)"
        helper="한글 IME · word-break · 인용문 · 이탤릭 동작."
      >
        <Editor
          initialContent={filledKorean}
          onChange={setWithKorean}
          editorClassName="font-[var(--font-pretendard)]"
        />
        <JsonPreview value={withKorean} />
      </Variant>
    </main>
  );
}

function Variant({
  label,
  helper,
  children,
}: {
  label: string;
  helper: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900">{label}</h2>
      <p className="text-xs text-zinc-500">{helper}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function JsonPreview({ value }: { value: JSONContent | null }) {
  if (!value) {
    return (
      <p className="rounded border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-400">
        onChange JSON 출력 — (아직 변경 없음)
      </p>
    );
  }
  return (
    <details className="rounded border border-zinc-200 bg-zinc-50">
      <summary className="cursor-pointer px-3 py-2 text-xs text-zinc-600">
        onChange JSON 출력 ({JSON.stringify(value).length} chars)
      </summary>
      <pre className="overflow-x-auto px-3 py-2 text-xs text-zinc-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
