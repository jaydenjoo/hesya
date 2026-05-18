"use client";

/**
 * Plan v4 Epic B — AI Photo Analysis 3-state Client Flow.
 *
 * State 1 (Upload) → user selects file → State 2 (Analyzing) animated steps →
 * State 3 (Result) bento grid.
 *
 * 디자인 ref: docs/design/reference/ai-flow-app.jsx.
 * Reduced-motion 존중 (애니메이션 step → 즉시 점프).
 */

import { Camera, Image as ImageIcon } from "lucide-react";

/**
 * Reference ai-flow-app.jsx L5-33 CamSparkles — K-beauty camera 룩
 * (body + lens 이중 원 + flash mount + 3 sparkles). 단순 lucide-react Sparkles
 * 대신 reference identity 일치하는 커스텀 SVG.
 */
function CamSparkles({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="10"
        y="22"
        width="60"
        height="42"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M28 22 32 14h16l4 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="44" r="11" stroke="currentColor" strokeWidth="2" />
      <circle cx="40" cy="44" r="5" stroke="currentColor" strokeWidth="2" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M62 14v6M59 17h6" />
        <path d="M68 32v4M66 34h4" />
        <path d="M14 14v4M12 16h4" />
      </g>
    </svg>
  );
}
import { useRef, useState, useTransition } from "react";
import { analyzePhotoAction } from "@/lib/photo-analysis/actions";

const ACCEPTED_MIME = "image/jpeg,image/png,image/webp";
const MAX_MB = 8;

export interface PhotoAnalyzeLabels {
  readonly back: string;
  readonly title: string;
  readonly dropHint: string;
  readonly cameraButton: string;
  readonly libraryButton: string;
  readonly privacy: string;
  readonly analyzing: {
    readonly reading: string;
    readonly matching: string;
    readonly capability: string;
    readonly done: string;
    readonly encourage: string;
    readonly poweredBy: string;
  };
  readonly result: {
    readonly heading: string;
    readonly styleLabel: string;
    readonly difficultyLabel: string;
    readonly difficultyEasy: string;
    readonly difficultyMedium: string;
    readonly difficultyHard: string;
    readonly timeLabel: string;
    readonly timeMinutes: string;
    readonly compatibilityLabel: string;
    readonly confidenceLabel: string;
    readonly retryButton: string;
    readonly disclaimer: string;
  };
  readonly errors: {
    readonly tooLarge: string;
    readonly invalidType: string;
    readonly rateLimited: string;
    readonly visionFailed: string;
    readonly generic: string;
  };
}

type Step = "reading" | "matching" | "capability" | "done";

interface ResultData {
  styleName: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
  compatibilityNote: string;
  confidence: number;
}

export function PhotoAnalyzeFlow({ labels }: { labels: PhotoAnalyzeLabels }) {
  const [phase, setPhase] = useState<"upload" | "analyzing" | "result">(
    "upload",
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzingStep, setAnalyzingStep] = useState<Step>("reading");
  const [result, setResult] = useState<ResultData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg(labels.errors.invalidType);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrorMsg(labels.errors.tooLarge);
      return;
    }
    setErrorMsg(null);
    setPreviewUrl(URL.createObjectURL(file));
    setPhase("analyzing");
    setAnalyzingStep("reading");

    // 애니메이션 step 진행 (실제 Vision 호출과 병렬)
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      const stepDelays: Array<[Step, number]> = [
        ["matching", 800],
        ["capability", 1800],
      ];
      stepDelays.forEach(([s, ms]) => {
        setTimeout(() => setAnalyzingStep(s), ms);
      });
    }

    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await analyzePhotoAction(fd);
      if (res.ok) {
        setAnalyzingStep("done");
        setResult({
          styleName: res.styleName,
          difficulty: res.difficulty,
          estimatedMinutes: res.estimatedMinutes,
          compatibilityNote: res.compatibilityNote,
          confidence: res.confidence,
        });
        setTimeout(() => setPhase("result"), reduce ? 0 : 300);
      } else {
        let msg = labels.errors.generic;
        if (res.errorCode === "rate_limited") msg = labels.errors.rateLimited;
        else if (res.errorCode === "vision_failed")
          msg = labels.errors.visionFailed;
        else if (res.errorCode === "too_large") msg = labels.errors.tooLarge;
        else if (res.errorCode === "invalid_type")
          msg = labels.errors.invalidType;
        setErrorMsg(msg);
        setPhase("upload");
      }
    });
  };

  const reset = () => {
    setPhase("upload");
    setPreviewUrl(null);
    setResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (phase === "upload") {
    return (
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        <h1 className="mb-6 text-center font-heading text-[24px] font-semibold italic tracking-[-0.02em] text-hesya-navy-900">
          {labels.title}
        </h1>

        <label
          htmlFor="photo-upload-input"
          className="block cursor-pointer rounded-3xl border-2 border-dashed border-hesya-amber-600/40 bg-white/60 px-6 py-12 text-center transition hover:border-hesya-amber-600 hover:bg-white"
        >
          <div className="mx-auto mb-4 flex justify-center text-hesya-amber-600">
            <CamSparkles size={64} />
          </div>
          <p className="text-[14px] text-hesya-navy-900/70">
            {labels.dropHint}
          </p>
          <input
            ref={fileInputRef}
            id="photo-upload-input"
            type="file"
            accept={ACCEPTED_MIME}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[12px] font-medium text-hesya-navy-900 ring-1 ring-hesya-navy-900/10 hover:bg-white"
          >
            <Camera size={14} />
            {labels.cameraButton}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/70 px-3 py-2 text-[12px] font-medium text-hesya-navy-900 ring-1 ring-hesya-navy-900/10 hover:bg-white"
          >
            <ImageIcon size={14} />
            {labels.libraryButton}
          </button>
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-2">
          <li className="flex flex-col items-center gap-1 rounded-xl border border-hesya-peach-100 bg-white/40 px-2 py-2.5 text-center">
            <span aria-hidden="true" className="text-[18px]">
              ⚡
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-hesya-amber-600">
              ~3s
            </span>
            <span className="text-[10.5px] leading-tight text-hesya-navy-900/65 [word-break:keep-all]">
              Claude Vision
            </span>
          </li>
          <li className="flex flex-col items-center gap-1 rounded-xl border border-hesya-peach-100 bg-white/40 px-2 py-2.5 text-center">
            <span aria-hidden="true" className="text-[18px]">
              🎯
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-hesya-amber-600">
              5+ 라벨
            </span>
            <span className="text-[10.5px] leading-tight text-hesya-navy-900/65 [word-break:keep-all]">
              스타일·시간·난이도
            </span>
          </li>
          <li className="flex flex-col items-center gap-1 rounded-xl border border-hesya-peach-100 bg-white/40 px-2 py-2.5 text-center">
            <span aria-hidden="true" className="text-[18px]">
              🔒
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-hesya-amber-600">
              비저장
            </span>
            <span className="text-[10.5px] leading-tight text-hesya-navy-900/65 [word-break:keep-all]">
              분석 후 즉시 삭제
            </span>
          </li>
        </ul>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-hesya-navy-900/55">
          {labels.privacy}
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-[12px] text-rose-800"
          >
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  if (phase === "analyzing") {
    const stepLabels: Array<[Step, string]> = [
      ["reading", labels.analyzing.reading],
      ["matching", labels.analyzing.matching],
      ["capability", labels.analyzing.capability],
      ["done", labels.analyzing.done],
    ];
    const activeIdx = stepLabels.findIndex(([k]) => k === analyzingStep);
    return (
      <div className="mx-auto w-full max-w-md px-5 pt-6">
        {previewUrl && (
          <div className="relative mx-auto mb-6 h-64 w-full max-w-sm overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl ring-4 ring-hesya-amber-500/70 photo-analyze-pulse"
            />
          </div>
        )}
        <div className="rounded-3xl bg-white px-5 py-4 ring-1 ring-hesya-navy-900/10">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {stepLabels.map(([key, label], i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              return (
                <span
                  key={key}
                  className={[
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                    done
                      ? "bg-hesya-amber-100 text-hesya-amber-700"
                      : active
                        ? "bg-hesya-amber-600 text-white"
                        : "bg-hesya-peach-100 text-hesya-navy-900/55",
                  ].join(" ")}
                >
                  {done && <span aria-hidden="true">✓</span>}
                  {label}
                </span>
              );
            })}
          </div>
          <p className="text-[12px] italic text-hesya-navy-900/65">
            &ldquo;{labels.analyzing.encourage}&rdquo;
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/45">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-hesya-amber-600"
            />
            {labels.analyzing.poweredBy}
          </p>
        </div>
      </div>
    );
  }

  // result phase
  if (!result) return null;
  const difficultyLabel =
    result.difficulty === "easy"
      ? labels.result.difficultyEasy
      : result.difficulty === "medium"
        ? labels.result.difficultyMedium
        : labels.result.difficultyHard;

  return (
    <div className="slide-up-result mx-auto w-full max-w-md px-5 pt-6 pb-12">
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          className="mx-auto mb-5 h-56 w-full max-w-sm rounded-3xl object-cover ring-1 ring-hesya-navy-900/10"
        />
      )}
      <h2 className="mb-4 font-heading text-[22px] font-semibold italic leading-tight text-hesya-navy-900">
        <span className="bg-[linear-gradient(transparent_70%,rgba(232,169,122,0.4)_70%)] px-1">
          {labels.result.heading}
        </span>
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-hesya-navy-900/10">
          <p className="text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/45">
            {labels.result.styleLabel}
          </p>
          <p className="mt-1 text-[14px] font-medium text-hesya-navy-900">
            {result.styleName}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-hesya-navy-900/10">
          <p className="text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/45">
            {labels.result.difficultyLabel}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {/* dot-meter: 3 dots, filled by difficulty (easy=1 / medium=2 / hard=3) */}
            <span aria-hidden="true" className="inline-flex items-center gap-1">
              {[0, 1, 2].map((i) => {
                const level =
                  result.difficulty === "easy"
                    ? 1
                    : result.difficulty === "medium"
                      ? 2
                      : 3;
                const on = i < level;
                return (
                  <span
                    key={i}
                    className={`inline-block h-2 w-2 rounded-full ${on ? "bg-hesya-amber-500" : "bg-hesya-peach-200"}`}
                  />
                );
              })}
            </span>
            <p className="text-[13px] font-semibold text-hesya-navy-900">
              {difficultyLabel}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-hesya-navy-900/10">
          <p className="text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/45">
            {labels.result.timeLabel}
          </p>
          <p className="mt-1 font-mono text-[16px] font-semibold text-hesya-navy-900">
            {labels.result.timeMinutes.replace(
              "{n}",
              String(result.estimatedMinutes),
            )}
          </p>
        </div>
        <div className="col-span-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-hesya-navy-900/10">
          <p className="text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/45">
            {labels.result.compatibilityLabel}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-hesya-navy-900/80">
            {result.compatibilityNote}
          </p>
        </div>
        <div className="col-span-2 flex items-center justify-between rounded-2xl bg-hesya-peach-100 px-4 py-2.5">
          <span className="text-[11px] uppercase tracking-[0.12em] text-hesya-navy-900/55">
            {labels.result.confidenceLabel}
          </span>
          <span className="font-mono text-[13px] font-semibold text-hesya-amber-700">
            {(result.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <p className="mt-5 text-center text-[10.5px] leading-relaxed text-hesya-navy-900/55">
        {labels.result.disclaimer}
      </p>

      <RecommendedStylists confidence={result.confidence} />

      <BeforeAfterSlider previewUrl={previewUrl} />

      <AuditAccordion confidence={result.confidence} />

      <SaveLookCard styleName={result.styleName} />

      <button
        type="button"
        onClick={reset}
        className="mt-5 w-full rounded-full bg-hesya-navy-900 px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-hesya-navy-800"
      >
        {labels.result.retryButton}
      </button>
    </div>
  );
}

function BeforeAfterSlider({ previewUrl }: { previewUrl: string | null }) {
  const [pos, setPos] = useState(50);
  return (
    <section
      className="mt-5 overflow-hidden rounded-2xl border border-hesya-peach-200 bg-white"
      aria-label="Before / After preview slider"
    >
      <header className="px-4 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
          어떤 모습이 될까요? · What it could look like
        </p>
      </header>
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-hesya-peach-50">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: previewUrl
              ? `url(${previewUrl})`
              : "linear-gradient(135deg, var(--color-hesya-peach-200, #f7d2b6) 0%, var(--color-hesya-peach-100, #fce5d2) 100%)",
            filter: "saturate(0.85) contrast(0.95)",
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: previewUrl
              ? `url(${previewUrl})`
              : "linear-gradient(135deg, #d99458 0%, #f5c994 50%, #f7d2b6 100%)",
            filter: "saturate(1.25) contrast(1.05) brightness(1.05)",
            clipPath: `inset(0 0 0 ${pos}%)`,
          }}
        />
        <span className="absolute left-3 top-3 rounded-full bg-hesya-navy-900/70 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-hesya-peach-50 backdrop-blur-sm">
          Before
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-hesya-amber-600/90 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
          After · AI
        </span>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-px bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
          style={{ left: `${pos}%` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg ring-1 ring-hesya-amber-500/30"
          style={{ left: `${pos}%` }}
        >
          <span className="font-mono text-[12px] font-bold text-hesya-amber-700">
            ↔
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label="Before/After comparison position"
          className="absolute inset-0 cursor-ew-resize opacity-0"
        />
      </div>
      <p className="px-4 py-2 text-center text-[10.5px] text-hesya-navy-900/55">
        ← 드래그하여 비교 · Drag to compare →
      </p>
    </section>
  );
}

function AuditAccordion({ confidence }: { confidence: number }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(confidence * 100);
  const items = [
    { k: "Strand thickness analyzed", v: "medium-fine" },
    { k: "Cut technique required", v: "point-cut + slide" },
    { k: "Stylists shown", v: "5+ similar past works" },
    { k: "Hair-tone simulation", v: `${pct}% confidence` },
  ] as const;
  return (
    <section className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-2xl border border-hesya-peach-200 bg-white px-4 py-3 text-left text-[12px] font-medium text-hesya-navy-900 transition hover:border-hesya-amber-500"
      >
        <span
          aria-hidden="true"
          className="grid h-6 w-6 place-items-center rounded-full bg-hesya-amber-500/15 text-[12px] text-hesya-amber-700"
        >
          ✓
        </span>
        <span className="flex-1">Why these recommendations?</span>
        <span
          aria-hidden="true"
          className={
            "text-hesya-navy-900/55 transition-transform " +
            (open ? "rotate-90" : "")
          }
        >
          ›
        </span>
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 rounded-2xl bg-hesya-peach-50/60 px-4 py-3">
          {items.map((it) => (
            <li
              key={it.k}
              className="flex items-start gap-2 text-[11.5px] leading-relaxed text-hesya-navy-900/75 [word-break:keep-all]"
            >
              <span aria-hidden="true" className="mt-0.5 text-hesya-amber-600">
                ·
              </span>
              <span>
                <b className="text-hesya-navy-900">{it.k}:</b> {it.v}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SaveLookCard({ styleName }: { styleName: string }) {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  const day = now.getDate();
  return (
    <section className="mt-7">
      <h3 className="font-heading text-[15px] font-semibold italic text-hesya-navy-900">
        Save the look · 룩 저장하기
      </h3>
      <p className="mb-3 mt-0.5 text-[11px] text-hesya-navy-900/55">
        Share-ready 9:16 card for Instagram Story or Xiaohongshu.
      </p>
      <div className="flex gap-3">
        <article
          aria-label="Share preview"
          className="relative aspect-[9/16] w-[120px] flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-hesya-peach-200 to-hesya-amber-600 p-3 text-white shadow-[0_4px_16px_rgba(26,34,56,0.18)]"
        >
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-white/80">
            Hesya
          </span>
          <p className="mt-2 font-heading text-[13px] font-semibold italic leading-tight">
            K-beauty pick
            <br />
            <span className="text-white/85">K-뷰티 픽</span>
          </p>
          <div className="absolute inset-x-3 bottom-2.5 space-y-0.5 text-[8.5px] leading-snug">
            <p className="truncate font-medium">{styleName}</p>
            <p className="text-white/85">
              Discovered {month} {day}
            </p>
            <p className="mt-1 border-t border-white/20 pt-1 text-[8px] text-white/75">
              5 languages welcome
            </p>
          </div>
        </article>
        <div className="flex flex-1 flex-col gap-1.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-hesya-navy-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-hesya-navy-800"
          >
            <span aria-hidden="true">📷</span>
            Save to Story
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-hesya-navy-900 ring-1 ring-hesya-peach-200 transition hover:border-hesya-amber-500"
          >
            <span aria-hidden="true">📤</span>
            Save to Photos
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[11px] font-semibold text-hesya-navy-900 ring-1 ring-hesya-peach-200 transition hover:border-hesya-amber-500"
          >
            <span aria-hidden="true">🔗</span>
            Copy share link
          </button>
        </div>
      </div>
    </section>
  );
}

const RECOMMENDED_STYLISTS = [
  {
    id: "su-jin",
    name: "이수진 Su-jin",
    salon: "Stylista — 홍대",
    matchBoost: 0.04,
    priceKrw: 85000,
    durationLabel: "2.5h",
    avatarTone: "linear-gradient(135deg, #F5DDC8, #D88B5B)",
  },
  {
    id: "min-ji",
    name: "박민지 Min-ji",
    salon: "유리 살롱 — 청담",
    matchBoost: 0.01,
    priceKrw: 95000,
    durationLabel: "2h",
    avatarTone: "linear-gradient(135deg, #E8C4D6, #D88B5B)",
  },
  {
    id: "ha-neul",
    name: "정하늘 Ha-neul",
    salon: "Mirror Glass — 성수",
    matchBoost: -0.02,
    priceKrw: 78000,
    durationLabel: "2h",
    avatarTone: "linear-gradient(135deg, #C9D6E8, #D88B5B)",
  },
] as const;

function RecommendedStylists({ confidence }: { confidence: number }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2 font-heading text-[15px] font-semibold italic text-hesya-navy-900">
        Recommended stylists
      </h3>
      <p className="mb-3 text-[11px] text-hesya-navy-900/55">
        Stylists with 5+ similar past works.
      </p>
      <div className="-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-2">
        {RECOMMENDED_STYLISTS.map((s) => {
          const match = Math.max(0, Math.min(0.99, confidence + s.matchBoost));
          return (
            <article
              key={s.id}
              className="flex w-[180px] flex-shrink-0 snap-start flex-col gap-2 rounded-3xl border border-hesya-peach-200 bg-white p-3 shadow-[0_2px_8px_rgba(26,34,56,0.04)]"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full font-heading text-[13px] font-semibold italic text-white"
                  style={{ background: s.avatarTone }}
                >
                  {s.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-hesya-navy-900">
                    {s.name}
                  </p>
                  <p className="truncate text-[10.5px] text-hesya-navy-900/60">
                    {s.salon}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 self-start rounded-full bg-hesya-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-hesya-amber-700">
                ★ {(match * 100).toFixed(0)}% match
              </span>
              <p className="text-[11px] text-hesya-navy-900/70">
                ₩{s.priceKrw.toLocaleString("ko-KR")} · {s.durationLabel}
              </p>
              <button
                type="button"
                className="mt-auto rounded-full bg-hesya-navy-900 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-hesya-navy-800"
              >
                Book →
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
