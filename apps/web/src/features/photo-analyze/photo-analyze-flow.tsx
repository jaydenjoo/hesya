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

import { Camera, Image as ImageIcon, Sparkles } from "lucide-react";
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
          <Sparkles
            size={64}
            strokeWidth={1.5}
            className="mx-auto mb-4 text-hesya-amber-600"
          />
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

        <p className="mt-6 text-center text-[11px] leading-relaxed text-hesya-navy-900/55">
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
    <div className="mx-auto w-full max-w-md px-5 pt-6 pb-12">
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          className="mx-auto mb-5 h-56 w-full max-w-sm rounded-3xl object-cover ring-1 ring-hesya-navy-900/10"
        />
      )}
      <h2 className="mb-4 font-heading text-[22px] font-semibold italic leading-tight text-hesya-navy-900">
        <span className="text-hesya-amber-600">{labels.result.heading}</span>
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
          <p className="mt-1 text-[13px] font-semibold text-hesya-navy-900">
            {difficultyLabel}
          </p>
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
