"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

const TICKER = [
  {
    num: "01",
    title: "5채널 통합 인박스",
    meta: "KakaoTalk · Instagram · WhatsApp · LINE · Facebook",
  },
  {
    num: "02",
    title: "AI 자동 응답 — 5개 언어 즉시 답장",
    meta: "한국어 · 日本語 · 中文 · English · Tiếng Việt",
  },
  {
    num: "03",
    title: "결제 통합 — 한 번에 정산",
    meta: "Stripe · Alipay+ · WeChat · LINE Pay · PayPay",
  },
  {
    num: "04",
    title: "K-Verified 매장 인증으로 신뢰 ↑",
    meta: "정부 등록 · 위생 점검 · 외국인 응대 검증",
  },
] as const;

const STORES = [
  { mark: "혜미", loc: "Seoul · 강남", italic: false, sans: false },
  { mark: "Lumière", loc: "Seoul · 청담", italic: true, sans: false },
  { mark: "스튜디오 정", loc: "Busan · 해운대", italic: false, sans: false },
  { mark: "STYLISTA", loc: "Seoul · 홍대", italic: true, sans: true },
] as const;

export function BrandPanel() {
  const [idx, setIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % TICKER.length);
        setExiting(false);
      }, 180);
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const goTo = (i: number) => {
    if (i === idx) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setExiting(true);
    setTimeout(() => {
      setIdx(i);
      setExiting(false);
    }, 180);
    timerRef.current = setInterval(() => {
      setExiting(true);
      setTimeout(() => {
        setIdx((j) => (j + 1) % TICKER.length);
        setExiting(false);
      }, 180);
    }, 4000);
  };

  return (
    <aside className="sl-brand">
      <div className="sl-brand-top">
        <div className="sl-brand-mark-row">
          <span className="sl-brand-mark">Hesya</span>
          <span className="sl-brand-tag">Store</span>
        </div>
        <Link href="/" className="sl-brand-back">
          ← 손님 페이지로
        </Link>
      </div>

      <div className="sl-brand-center">
        <div className="sl-eyebrow">
          <span className="sl-eyebrow-dot" />
          <span>매장 매니저 콘솔</span>
        </div>
        <div className="sl-hero-mark">
          Run your salon<span className="sl-period">.</span>
        </div>
        <div className="sl-hero-sub">
          외국인 손님을 위한 매장 운영의 모든 것
        </div>
        <div className="sl-hero-sub-en">
          One desk · five channels · five languages.
        </div>

        <div className="sl-ticker" aria-live="polite">
          <div className="sl-ticker-label">
            <span>Why Hesya</span>
            <span>{String(idx + 1).padStart(2, "0")} / 04</span>
          </div>
          <div className="sl-ticker-track">
            {TICKER.map((t, i) => (
              <div
                key={i}
                className={
                  "sl-ticker-item" +
                  (i === idx ? (exiting ? " exit" : " active") : "")
                }
              >
                <div className="sl-ticker-num">{t.num}</div>
                <div className="sl-ticker-body">
                  <div className="sl-ticker-title">{t.title}</div>
                  <div className="sl-ticker-meta">{t.meta}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="sl-ticker-dots">
            {TICKER.map((_, i) => (
              <button
                key={i}
                type="button"
                className={"sl-ticker-dot" + (i === idx ? " active" : "")}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="sl-brand-foot">
        <div className="sl-foot-caption">함께하는 매장들</div>
        <div className="sl-foot-logos">
          {STORES.map((s, i) => (
            <div key={i} className="sl-store-logo">
              <span className={"sl-store-logo-mark" + (s.sans ? " sans" : "")}>
                {s.mark}
              </span>
              <span className="sl-store-logo-loc">{s.loc}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
