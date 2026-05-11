"use client";

import { useEffect, useState } from "react";

const GREETINGS: ReadonlyArray<{ lang: string; text: string; kr: boolean }> = [
  { lang: "en", text: "Welcome to Korea.", kr: false },
  { lang: "ko", text: "한국에 오신 것을 환영합니다.", kr: true },
  { lang: "ja", text: "韓国へようこそ。", kr: true },
  { lang: "zh", text: "欢迎来到韩国。", kr: true },
  { lang: "vi", text: "Chào mừng đến Hàn Quốc.", kr: false },
];

const CYCLE_MS = 3200;

export function GreetingTicker() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((prev) => (prev + 1) % GREETINGS.length);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  const wide = idx === 0 || idx === 4;

  return (
    <div className="ix-greeting" data-testid="greeting-ticker">
      <div className="relative h-20">
        {GREETINGS.map((g, i) => (
          <div
            key={g.lang}
            data-lang={g.lang}
            data-active={i === idx ? "true" : "false"}
            className={`absolute inset-x-0 top-0 tracking-[-0.02em] text-hesya-navy-900 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              i === idx ? "opacity-100" : "opacity-0"
            } ${
              g.kr
                ? "font-bold text-[26px] leading-9"
                : "italic font-semibold text-[28px] leading-9"
            }`}
          >
            {g.text}
          </div>
        ))}
      </div>
      <div
        aria-hidden
        className="mt-1 mb-3.5 h-[3px] rounded-sm bg-hesya-amber-500 transition-[width] duration-300 ease-out motion-reduce:transition-none"
        style={{ width: wide ? 36 : 28 }}
      />
    </div>
  );
}
