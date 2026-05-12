"use client";

/**
 * Plan v3 M3.4 — customer magic link sign-in form (Client).
 *
 * email 입력 → server action 호출 → ok 응답 시 /{locale}/c/sign-in/sent로 navigate.
 * 보안: invalid email 시 client-side 즉시 에러 표시 (HTML5 email + zod 백엔드).
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { customerMagicLinkSignInAction } from "@/app/[locale]/c/sign-in/actions";

export interface SignInFormLabels {
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  sending: string;
  errorInvalidEmail: string;
  securityNote: string;
}

interface Props {
  locale: string;
  labels: SignInFormLabels;
}

export function SignInForm({ locale, labels }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError(labels.errorInvalidEmail);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await customerMagicLinkSignInAction({
        email: email.trim(),
        locale,
      });
      if (!result.ok) {
        setError(result.message ?? labels.errorInvalidEmail);
        return;
      }
      const sent = `/${locale}/c/sign-in/sent?email=${encodeURIComponent(email.trim())}`;
      router.push(sent);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.16em] text-hesya-navy-900/70">
          {labels.emailLabel}
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.emailPlaceholder}
          className="w-full rounded-2xl border border-hesya-navy-900/15 bg-white/80 px-4 py-3 text-[15px] text-hesya-navy-900 placeholder:text-hesya-navy-900/40 focus:border-hesya-amber-600 focus:outline-none focus:ring-2 focus:ring-hesya-amber-600/30"
        />
      </label>

      {error && (
        <p role="alert" className="text-[12px] font-medium text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-hesya-navy-900 px-6 py-3.5 text-[14px] font-semibold tracking-wide text-hesya-peach-50 transition hover:bg-hesya-navy-900/90 disabled:opacity-60"
      >
        {isPending ? labels.sending : labels.submit}
      </button>

      <p className="pt-2 text-[11px] leading-relaxed text-hesya-navy-900/55">
        {labels.securityNote}
      </p>
    </form>
  );
}
