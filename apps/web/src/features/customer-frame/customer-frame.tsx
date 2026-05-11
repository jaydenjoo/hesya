/**
 * Plan v3 Phase D1-A2 — Customer Frame wrapper.
 *
 * 외국인 손님 페이지(M2.x) 공통 layout. 모바일은 full-screen, 데스크톱은 화면
 * 중앙에 ~440px 폭의 모바일 frame 안에 렌더 (레퍼런스 iPhone 프레임 정합).
 *
 * 배경: 상단에 peach 방사형 grad + 베이스 peach-50. 외국인 손님 첫 인상
 * (따뜻한 한국 미용실 분위기) 시그널.
 */

interface Props {
  readonly children: React.ReactNode;
  /** 데스크톱에서 navy border iPhone-like frame 사용 여부 (success 등 일부 페이지는 frame 없이 시원하게). 기본 true. */
  readonly framed?: boolean;
}

export function CustomerFrame({ children, framed = true }: Props) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-hesya-peach-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] -z-10"
        style={{
          background:
            "radial-gradient(ellipse 1000px 600px at 50% -100px, var(--hesya-peach-200), transparent 55%)",
        }}
      />
      {framed ? (
        <div className="mx-auto w-full max-w-[440px] min-h-screen bg-hesya-peach-50/40 lg:my-8 lg:min-h-[820px] lg:max-h-[calc(100vh-64px)] lg:rounded-[44px] lg:border-[10px] lg:border-hesya-navy-900 lg:shadow-[0_30px_80px_-20px_rgba(26,34,56,0.35)] lg:overflow-hidden">
          <div className="h-full overflow-y-auto pb-12">{children}</div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[440px] px-0 pb-12">
          {children}
        </div>
      )}
    </div>
  );
}
