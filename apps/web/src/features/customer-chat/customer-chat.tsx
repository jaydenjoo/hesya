"use client";

/**
 * Sprint 2A PR-A2 — Customer Chat 클라이언트 컴포넌트.
 *
 * Reference: `docs/design/reference/chat-app.jsx`.
 * iPhone-frame 내부 헤더 + 메시지 스트림 (text/image/voice) + composer + audit sheet.
 * 양방향 자동 번역 + 신뢰도 표시 (confident vs ambiguous).
 *
 * Mock 단계 — 입력 보내기는 draft만 reflect, 실 전송 미연결. 베타 매장 매칭 후
 * inbox owner 측 thread와 연결 예정 (Phase 1.5).
 */

import { useState } from "react";
import type { ChatMessage, ChatTextMessage } from "@/lib/mock-fixtures/chat";

export interface CustomerChatLabels {
  readonly back: string;
  readonly statusOnline: string;
  readonly statusResponds: string; // ICU `{time}` (e.g., "responds in ~{time}")
  readonly translateOn: string;
  readonly translateOff: string;
  readonly translateLabel: string;
  readonly composerPlaceholder: string;
  readonly composerPhoto: string;
  readonly composerVoice: string;
  readonly composerSend: string;
  readonly aiHint: string;
  readonly aiHintPill: string;
  readonly voiceTranscriptLabel: string;
  readonly auditTitle: string;
  readonly auditOriginal: string; // ICU `{lang}` (e.g., "Original ({lang})")
  readonly auditTranslated: string; // ICU `{lang}`
  readonly auditConfident: string;
  readonly auditAmbiguousDefault: string;
  readonly auditClose: string;
}

interface Props {
  readonly storeName: string;
  readonly storeInitial: string;
  readonly responseTime: string;
  readonly day: string;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly labels: CustomerChatLabels;
}

export function CustomerChat({
  storeName,
  storeInitial,
  responseTime,
  day,
  messages,
  labels,
}: Props) {
  const [translateOn, setTranslateOn] = useState(true);
  const [draft, setDraft] = useState("");
  const [audit, setAudit] = useState<ChatTextMessage | null>(null);

  return (
    <div className="relative flex h-full min-h-screen flex-col bg-hesya-peach-50/30 lg:min-h-[820px]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-hesya-navy-900/5 bg-white/90 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          aria-label={labels.back}
          onClick={() => history.back()}
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-hesya-navy-900 transition hover:bg-hesya-peach-100"
        >
          ←
        </button>
        <div className="relative inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-hesya-amber-200 to-hesya-amber-600 font-heading text-[16px] font-semibold italic text-white">
          {storeInitial}
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 inline-flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-emerald-500"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-semibold italic text-hesya-navy-900">
            {storeName}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-hesya-navy-900/55">
            <span
              aria-hidden="true"
              className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            {labels.statusOnline} ·{" "}
            {labels.statusResponds.replace("{time}", responseTime)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTranslateOn((v) => !v)}
          aria-label={labels.translateLabel}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
            translateOn
              ? "bg-hesya-amber-500 text-white"
              : "bg-hesya-peach-100 text-hesya-navy-900/70"
          }`}
        >
          <span aria-hidden="true">🌐</span>
          {translateOn ? labels.translateOn : labels.translateOff}
        </button>
      </header>

      {/* Message stream */}
      <main
        data-testid="chat-stream"
        className="flex-1 space-y-2 overflow-y-auto px-4 py-4"
      >
        <p className="my-3 text-center text-[11px] font-medium text-hesya-navy-900/40">
          {day}
        </p>
        {messages.map((m) => (
          <Bubble
            key={m.id}
            msg={m}
            translateOn={translateOn}
            voiceTranscriptLabel={labels.voiceTranscriptLabel}
            onAudit={(text) => setAudit(text)}
          />
        ))}
        {/* Typing indicator */}
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-hesya-navy-900/5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-hesya-navy-900/30"
                style={{
                  animation: "chatTyping 1.2s infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Composer */}
      <footer className="sticky bottom-0 z-10 border-t border-hesya-navy-900/5 bg-white px-3 pb-5 pt-3">
        {draft.length > 0 && (
          <div className="mb-2 flex items-center gap-2 rounded-2xl bg-hesya-peach-100 px-3 py-2 text-[11.5px] text-hesya-navy-900/80">
            <span aria-hidden="true">✨</span>
            <span>{labels.aiHint}</span>
            <span className="ml-auto inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10.5px] font-medium text-hesya-amber-600 ring-1 ring-hesya-amber-600/20">
              &ldquo;{labels.aiHintPill}&rdquo;
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 rounded-full bg-hesya-peach-50 px-2 py-1.5 ring-1 ring-hesya-navy-900/5">
          <button
            type="button"
            aria-label={labels.composerPhoto}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-hesya-navy-900/60 transition hover:bg-white"
          >
            <span aria-hidden="true">📷</span>
          </button>
          <button
            type="button"
            aria-label={labels.composerVoice}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-hesya-navy-900/60 transition hover:bg-white"
          >
            <span aria-hidden="true">🎙️</span>
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={labels.composerPlaceholder}
            data-testid="chat-input"
            className="flex-1 bg-transparent px-1.5 py-1.5 text-[14px] text-hesya-navy-900 placeholder:text-hesya-navy-900/40 focus:outline-none"
          />
          <button
            type="button"
            aria-label={labels.composerSend}
            disabled={draft.length === 0}
            data-testid="chat-send"
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
              draft.length > 0
                ? "bg-hesya-amber-500 text-white shadow-sm"
                : "bg-hesya-navy-900/10 text-hesya-navy-900/30"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </footer>

      {/* Audit sheet */}
      {audit && (
        <div
          onClick={() => setAudit(null)}
          className="fixed inset-0 z-40 bg-hesya-navy-900/40 backdrop-blur-sm lg:absolute"
          data-testid="chat-audit-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-3 bottom-3 rounded-3xl bg-white p-5 shadow-2xl"
          >
            <span
              aria-hidden="true"
              className="mx-auto mb-3 block h-1 w-9 rounded-full bg-hesya-navy-900/15"
            />
            <h3 className="mb-3 font-heading text-[18px] font-semibold italic text-hesya-navy-900">
              {labels.auditTitle}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-hesya-navy-900/40">
                  {labels.auditOriginal.replace(
                    "{lang}",
                    audit.lang.split("→")[0]!,
                  )}
                </p>
                <p className="mt-1 text-[14px] text-hesya-navy-900 [word-break:keep-all]">
                  {audit.kr ?? audit.src}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-hesya-navy-900/40">
                  {labels.auditTranslated.replace(
                    "{lang}",
                    audit.lang.split("→")[1]!,
                  )}
                </p>
                <p className="mt-1 text-[14px] text-hesya-navy-900 [word-break:keep-all]">
                  {audit.tr}
                </p>
              </div>
              <p
                className={`rounded-xl px-3 py-2 text-[12.5px] ${
                  audit.confidence === "confident"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {audit.confidence === "confident"
                  ? labels.auditConfident
                  : `△ ${audit.note ?? labels.auditAmbiguousDefault}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAudit(null)}
              className="mt-4 w-full rounded-full bg-hesya-navy-900 px-4 py-3 text-[13px] font-semibold text-white"
            >
              {labels.auditClose}
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes chatTyping {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}

function Bubble({
  msg,
  translateOn,
  voiceTranscriptLabel,
  onAudit,
}: {
  msg: ChatMessage;
  translateOn: boolean;
  voiceTranscriptLabel: string;
  onAudit: (m: ChatTextMessage) => void;
}) {
  const isSalon = msg.from === "salon";
  const align = isSalon ? "justify-start" : "justify-end";
  const bg = isSalon
    ? "bg-white text-hesya-navy-900 ring-1 ring-hesya-navy-900/5"
    : "bg-hesya-amber-500 text-white";
  const corner = isSalon ? "rounded-bl-md" : "rounded-br-md";

  if (msg.type === "image") {
    return (
      <div className={`flex ${align}`}>
        <div
          className={`flex max-w-[78%] flex-col overflow-hidden rounded-2xl ${corner} ${bg}`}
        >
          <div className="flex items-center gap-2 bg-hesya-peach-100/60 px-3 py-6 text-hesya-navy-900/55">
            <span aria-hidden="true" className="text-[28px]">
              📸
            </span>
            <span className="text-[12px] font-medium">{msg.caption}</span>
          </div>
          {translateOn && (
            <div className="bg-black/5 px-3 py-2 text-[11px] text-hesya-navy-900/65">
              <span aria-hidden="true" className="mr-1">
                🌐
              </span>
              {msg.tr}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (msg.type === "voice") {
    return (
      <div className={`flex ${align}`}>
        <div
          className={`flex max-w-[78%] flex-col rounded-2xl ${corner} ${bg}`}
        >
          <div className="flex items-center gap-2 px-3 py-3">
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-hesya-amber-600"
            >
              ▶
            </span>
            <span
              aria-hidden="true"
              className="flex flex-1 items-center gap-[2px]"
            >
              {Array.from({ length: 22 }).map((_, i) => {
                const h = 4 + Math.abs(Math.sin(i * 0.7)) * 14;
                return (
                  <span
                    key={i}
                    className="inline-block w-[2px] rounded-full bg-white/70"
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </span>
            <span className="font-mono text-[11px] opacity-90">
              {msg.duration}
            </span>
          </div>
          {translateOn && (
            <div className="space-y-1 border-t border-white/15 px-3 py-2 text-[11px] text-white/95">
              <p>
                <span aria-hidden="true" className="mr-1">
                  🌐
                </span>
                <b>{voiceTranscriptLabel}:</b> {msg.transcript}
              </p>
              <p className="text-white/85">→ {msg.tr}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[78%] rounded-2xl ${corner} ${bg} px-3.5 py-2.5`}>
        <p className="text-[14px] leading-relaxed [word-break:keep-all]">
          {isSalon ? msg.kr : msg.src}
        </p>
        {translateOn && (
          <button
            type="button"
            onClick={() => onAudit(msg)}
            className={`mt-1.5 flex items-start gap-1.5 text-left text-[11px] leading-relaxed ${
              isSalon ? "text-hesya-navy-900/55" : "text-white/80"
            } transition hover:underline`}
          >
            <span aria-hidden="true" className="mt-0.5 flex-shrink-0">
              🌐
            </span>
            <span className="[word-break:keep-all]">{msg.tr}</span>
          </button>
        )}
      </div>
    </div>
  );
}
