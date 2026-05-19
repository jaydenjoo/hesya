"use client";

/**
 * First-Visit Walkthrough — 3-step intro overlay.
 * Reference: docs/design/reference/Hesya First-Visit Walkthrough.html
 *
 * 베타 압축 구현:
 *   - 영문 1 locale (5 locale 동적 전환은 후속 PR)
 *   - 3 step bubble + dot nav + skip dialog
 *   - localStorage hesya_walkthrough_done 플래그
 *   - iPhone frame illustration → 단순 svg placeholder
 */

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "hesya_walkthrough_done";

type Step = {
  eyebrow: string;
  h: string;
  sub: string;
  icon: "chat" | "card" | "clock";
};

const STEPS: Step[] = [
  {
    eyebrow: "STEP 1 OF 3",
    h: "Korean salons, your language.",
    sub: "Message any verified salon in English, Japanese, or Chinese. We translate both ways.",
    icon: "chat",
  },
  {
    eyebrow: "STEP 2 OF 3",
    h: "Book + pay in one flow.",
    sub: "Foreign cards work. Stripe, Alipay, WeChat Pay all accepted.",
    icon: "card",
  },
  {
    eyebrow: "STEP 3 OF 3",
    h: "Replies in 3 minutes. Day or night.",
    sub: "Salons and AI work together so you always get a fast reply.",
    icon: "clock",
  },
];

function IconChat() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function WalkthroughView() {
  // Initial-state lazy reader for localStorage — avoids setState inside effect.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const finish = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  }, []);

  const startOver = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStep(0);
    setOpen(true);
  }, []);

  const next = useCallback(() => {
    if (step + 1 < STEPS.length) setStep(step + 1);
    else finish();
  }, [step, finish]);

  const requestSkip = useCallback(() => setConfirmOpen(true), []);

  useEffect(() => {
    if (confirmOpen) {
      setTimeout(() => cancelRef.current?.focus(), 50);
    }
  }, [confirmOpen]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestSkip();
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft" && step > 0) {
        setStep(step - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, next, requestSkip]);

  const cur = STEPS[step];

  return (
    <div className="wt-page">
      <main className="host">
        <div className="host-bar">
          <span className="host-brand">
            Hesya<span className="pill">·KR</span>
          </span>
        </div>
        <div className="host-main">
          <div className="host-card">
            <h1>Demo host page</h1>
            <p>
              The Hesya app would normally render a salon list here. This page
              is just to show the first-visit walkthrough.
            </p>
            <button type="button" className="demo-btn" onClick={startOver}>
              Replay walkthrough →
            </button>
          </div>
        </div>
      </main>

      {open && (
        <div
          className="wt-backdrop open"
          role="dialog"
          aria-modal="true"
          aria-label="First-visit walkthrough"
        >
          <div className="wt-card">
            <div className="wt-step" data-active="true">
              <div className="wt-eyebrow">{cur.eyebrow}</div>
              <h2 className="wt-h">{cur.h}</h2>
              <p className="wt-sub">{cur.sub}</p>
              <div className="wt-illu" aria-hidden="true">
                {cur.icon === "chat" ? (
                  <IconChat />
                ) : cur.icon === "card" ? (
                  <IconCard />
                ) : (
                  <IconClock />
                )}
              </div>
              <div className="wt-dots" aria-hidden="true">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={
                      "wt-dot " +
                      (i === step ? "active" : i < step ? "visited" : "")
                    }
                  />
                ))}
              </div>
              <div className="wt-actions">
                <button
                  type="button"
                  className="wt-btn skip"
                  onClick={requestSkip}
                >
                  Skip
                </button>
                <button type="button" className="wt-btn primary" onClick={next}>
                  {step + 1 === STEPS.length ? "Get started" : "Next →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="wt-confirm"
        data-open={confirmOpen ? "true" : undefined}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cd-h"
      >
        <div className="wt-confirm-card">
          <h3 id="cd-h">Skip the tour?</h3>
          <p>You can replay it anytime from this page.</p>
          <div className="row">
            <button
              type="button"
              ref={cancelRef}
              className="wt-btn primary"
              onClick={() => setConfirmOpen(false)}
            >
              Keep going
            </button>
            <button
              type="button"
              className="wt-btn skip"
              onClick={() => {
                setConfirmOpen(false);
                finish();
              }}
            >
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
