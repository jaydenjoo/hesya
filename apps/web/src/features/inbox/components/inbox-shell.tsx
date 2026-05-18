"use client";

/**
 * Epic 1B-UI A-1 — 인박스 3-col 골조.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 1/2/3)의 레이아웃
 * 골조만 구현. 시각 디테일(채널 chip, 톤 4탭, ContextPanel 4탭)은 A-2/A-3/A-4
 * 별 PR에서 단계적 적용.
 *
 * **shadcn ResizablePanelGroup 보존**: 디자인 ref는 plain CSS grid이지만
 * 사장이 col 너비 조정 가능한 게 실용적. 1A의 2-col 패턴 자연 확장.
 *
 * **contextColumn 옵셔널**: A-4 진입 전까지 placeholder. 빈 상태에서도
 * 3-col 비율 유지(고객 미선택 시 그대로 빈 panel).
 *
 * **a11y**: 각 col을 region+aria-label로 명명 → 스크린리더가 사장이 어느
 * 영역에 있는지 안내.
 */

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export type InboxShellProps = {
  threadColumn: React.ReactNode;
  messageColumn: React.ReactNode;
  contextColumn?: React.ReactNode;
};

export function InboxShell({
  threadColumn,
  messageColumn,
  contextColumn,
}: InboxShellProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      <ResizablePanel defaultSize={22} minSize={16}>
        <section
          aria-label="Thread list"
          className="flex h-full flex-col border-r border-hesya-peach-100 bg-white"
        >
          {threadColumn}
        </section>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={52} minSize={32}>
        <section
          aria-label="Message view"
          className="flex h-full flex-col bg-hesya-peach-50"
        >
          {messageColumn}
        </section>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={26} minSize={18}>
        <section
          aria-label="Customer context"
          className="flex h-full flex-col border-l border-hesya-peach-100 bg-white"
        >
          {contextColumn ?? (
            <div
              data-testid="inbox-context-placeholder"
              className="kr p-4 text-sm text-gray-500"
            >
              고객 정보는 추후 연결됩니다.
            </div>
          )}
        </section>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
