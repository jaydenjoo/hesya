"use client";

/**
 * O2 fast track #7 (#5) — Floating keyboard shortcut FAB + modal.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Shortcuts +
 * `inbox.css` `.ix-shortcut-*`).
 *
 * 11개 단축키 표시. 실제 binding은 `inbox-client.tsx` (#6)에서 처리.
 * FAB는 page-level fixed positioning이라 modal 자체에 portal 불필요
 * (overlay z-index 100으로 충분).
 */

interface Props {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

const SHORTCUTS: ReadonlyArray<{ keys: string[]; desc: string }> = [
  { keys: ["J"], desc: "다음 대화" },
  { keys: ["K"], desc: "이전 대화" },
  { keys: ["R"], desc: "답장" },
  { keys: ["A"], desc: "AI 초안 그대로 보내기" },
  { keys: ["E"], desc: "AI 초안 편집" },
  { keys: ["M"], desc: "VIP 표시" },
  { keys: ["✓"], desc: "완료 처리" },
  { keys: ["1", "–", "9"], desc: "템플릿 삽입" },
  { keys: ["⌘", "↵"], desc: "보내기" },
  { keys: ["⌘", "F"], desc: "인박스 검색" },
  { keys: ["?"], desc: "단축키 보기" },
];

export function ShortcutFab({ open, onOpenChange }: Props) {
  return (
    <>
      <button
        type="button"
        className="ix-shortcut-fab"
        onClick={() => onOpenChange(true)}
        aria-label="키보드 단축키 보기"
        data-testid="shortcut-fab"
      >
        ?
      </button>
      {open ? (
        <div
          className="ix-shortcut-overlay"
          onClick={() => onOpenChange(false)}
          data-testid="shortcut-overlay"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="키보드 단축키"
            className="ix-shortcut-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ix-shortcut-head">
              <h3 className="kr">키보드 단축키</h3>
              <button
                type="button"
                className="ix-shortcut-close"
                onClick={() => onOpenChange(false)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className="ix-shortcut-grid">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="ix-shortcut-row">
                  <span className="ix-shortcut-keys">
                    {s.keys.map((k, j) =>
                      k === "–" ? (
                        <span key={j} className="ix-shortcut-dash">
                          –
                        </span>
                      ) : (
                        <kbd key={j}>{k}</kbd>
                      ),
                    )}
                  </span>
                  <span className="ix-shortcut-desc kr">{s.desc}</span>
                </div>
              ))}
            </div>
            <div className="ix-shortcut-foot kr">
              ESC 또는 외부 클릭으로 닫기
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
