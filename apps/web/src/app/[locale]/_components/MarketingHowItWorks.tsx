"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { MarketingEyebrow } from "./MarketingEyebrow";
import { MarketingSectionNum } from "./MarketingSectionNum";

type PhoneCard = {
  name: string;
  meta: string;
  score?: string;
  lang?: "ko";
  center?: boolean;
};

type PhoneStep =
  | {
      kind: "photo";
      h4: string;
      inputs: Array<{ text: string; lang?: "ko" }>;
    }
  | {
      kind: "cards";
      h4: string;
      cards: PhoneCard[];
    }
  | {
      kind: "booked";
      bookline: string;
      qrCode: string;
      qrMeta: string;
    };

export function MarketingHowItWorks() {
  const t = useTranslations("MarketingLanding");
  const steps = [
    { title: t("howStep1Title"), body: t("howStep1Body") },
    { title: t("howStep2Title"), body: t("howStep2Body") },
    { title: t("howStep3Title"), body: t("howStep3Body") },
    { title: t("howStep4Title"), body: t("howStep4Body") },
  ];

  const phoneSteps: PhoneStep[] = [
    {
      kind: "photo",
      h4: t("hiwPhoneStep1Title"),
      inputs: [
        { text: "“송혜교 단발이요”", lang: "ko" },
        { text: "“Glass-skin makeup, please”" },
      ],
    },
    {
      kind: "cards",
      h4: t("hiwPhoneStep2Title"),
      cards: [
        {
          name: "Stylista — 홍대점",
          meta: "Hongdae · 4 min walk",
          score: "★ 4.92 match",
        },
        {
          name: "Color Lab Hongdae",
          meta: "Hongdae · 7 min walk",
          score: "★ 4.79 match",
        },
        {
          name: "Soohair — 명동",
          meta: "Myeongdong · 12 min walk",
          score: "★ 4.86 match",
        },
      ],
    },
    {
      kind: "cards",
      h4: t("hiwPhoneStep3Title"),
      cards: [
        { name: "Tue · May 14 · 2:30 PM", meta: "Glass-skin makeup · 60 min" },
        { name: "JPY 5,800", meta: "Pay in JPY · settled in KRW" },
        {
          name: "메모",
          meta: "“Auto-translated to Korean for the salon.”",
          lang: "ko",
        },
      ],
    },
    {
      kind: "booked",
      bookline: t("hiwPhoneStep4Title"),
      qrCode: "HSY-A4F8",
      qrMeta: "Show at front desk",
    },
  ];

  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.45) {
            const i = Number(e.target.getAttribute("data-step"));
            if (!Number.isNaN(i)) setActiveStep(i);
          }
        });
      },
      { threshold: [0.45, 0.6, 0.75] },
    );
    stepRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="how-h2"
      className="relative bg-hesya-peach-50 px-6 py-20 md:py-32"
    >
      <MarketingSectionNum value="03" />
      <div className="relative mx-auto max-w-7xl">
        <MarketingEyebrow>{t("howEyebrow")}</MarketingEyebrow>
        <h2
          id="how-h2"
          className="max-w-3xl font-heading text-4xl leading-[1.05] tracking-tight text-hesya-navy-900 md:text-5xl lg:text-6xl"
        >
          {t.rich("howTitle", {
            em: (chunks) => <em className="text-hesya-amber-700">{chunks}</em>,
          })}
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-[1.05fr_1fr]">
          <ol className="space-y-0">
            {steps.map((s, i) => {
              const isActive = i === activeStep;
              return (
                <li
                  key={s.title}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  data-step={i}
                  className="flex min-h-[60vh] flex-col justify-center py-12 md:min-h-[80vh] md:py-16"
                >
                  <span
                    aria-hidden="true"
                    role="presentation"
                    className={`font-heading text-[120px] font-medium italic leading-[0.9] tracking-[-0.04em] transition-[stroke] md:text-[200px] ${
                      isActive
                        ? "text-hesya-peach-100 [-webkit-text-stroke:2px_var(--color-hesya-amber-500)]"
                        : "text-transparent [-webkit-text-stroke:1.5px_var(--color-hesya-amber-600)]"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 max-w-md font-heading text-3xl leading-tight text-hesya-navy-900 md:text-4xl">
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-gray-700 md:text-lg">
                    {s.body}
                  </p>
                  <span
                    aria-hidden="true"
                    className={`mt-6 block h-[2px] bg-hesya-amber-500 transition-[width] duration-300 ${
                      isActive ? "w-16" : "w-0"
                    }`}
                  />
                </li>
              );
            })}
          </ol>

          <div className="hidden md:block">
            <div className="sticky top-32 mx-auto w-[320px]">
              <div
                role="img"
                aria-label="Mobile app preview"
                className="relative h-[640px] rounded-[44px] bg-hesya-navy-900 p-3.5 shadow-2xl"
              >
                <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-hesya-peach-50">
                  {phoneSteps.map((step, i) => (
                    <div
                      key={i}
                      aria-hidden={i !== activeStep}
                      className={`absolute inset-0 px-5 py-8 transition-opacity duration-300 ${
                        i === activeStep ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      {step.kind === "photo" ? (
                        <>
                          <h4 className="mb-3 font-sans text-lg font-bold tracking-tight text-hesya-navy-900">
                            {step.h4}
                          </h4>
                          <div
                            aria-hidden="true"
                            className="relative mb-4 grid aspect-square w-full place-items-center rounded-2xl bg-gradient-to-br from-hesya-peach-100 to-hesya-amber-500"
                          >
                            <span className="block h-14 w-14 rounded-full border-[3px] border-white" />
                          </div>
                          {step.inputs.map((input, j) => (
                            <p
                              key={j}
                              lang={input.lang}
                              className="mb-2.5 rounded-xl bg-hesya-peach-100 px-3.5 py-3 text-[12.5px] text-hesya-navy-700"
                            >
                              {input.text}
                            </p>
                          ))}
                        </>
                      ) : null}

                      {step.kind === "cards" ? (
                        <>
                          <h4 className="mb-3 font-sans text-lg font-bold tracking-tight text-hesya-navy-900">
                            {step.h4}
                          </h4>
                          {step.cards.map((card, j) => (
                            <div
                              key={j}
                              lang={card.lang}
                              className={`mb-2.5 rounded-xl border border-hesya-peach-100 bg-white px-3.5 py-3 text-[12.5px] text-hesya-navy-900 ${card.center ? "text-center" : ""}`}
                            >
                              <p className="text-[13px] font-bold leading-tight">
                                {card.name}
                              </p>
                              <p className="mt-1 text-[11px] text-hesya-navy-700">
                                {card.meta}
                              </p>
                              {card.score ? (
                                <span className="mt-1.5 inline-block rounded-full bg-[rgba(34,130,80,0.12)] px-2 py-0.5 font-mono text-[10px] font-bold text-[#226E50]">
                                  {card.score}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </>
                      ) : null}

                      {step.kind === "booked" ? (
                        <>
                          <p className="my-3 text-center font-heading text-[22px] italic text-hesya-navy-900">
                            {step.bookline}
                          </p>
                          <div
                            aria-hidden="true"
                            className="mx-auto mb-3 h-[160px] w-[160px] rounded-[10px] border-2 border-hesya-navy-900 bg-white"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(0deg, #1A2238 0 6px, transparent 6px 12px), repeating-linear-gradient(90deg, #1A2238 0 6px, transparent 6px 12px)",
                            }}
                          />
                          <div className="rounded-xl border border-hesya-peach-100 bg-white px-3.5 py-3 text-center text-[12.5px]">
                            <p className="text-[13px] font-bold">
                              {step.qrCode}
                            </p>
                            <p className="mt-1 text-[11px] text-hesya-navy-700">
                              {step.qrMeta}
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
