"use client";

/**
 * Customer email + password sign-in form (Client).
 *
 * 외국인 손님용 즉시 로그인. Better Auth `signIn.email` 호출 → Set-Cookie 자동 →
 * /{locale}/c/mypage로 navigate. 가입은 별도 (현재 prod에는 demo 계정만 1건 +
 * 베타 출시 후 Google OAuth로 self sign-up).
 *
 * 디자인: CustomerFrame peach 모바일 frame 톤 (rounded-2xl + amber accent).
 * Owner sign-in-form (sl-* 톤)과는 별도 — customer은 모바일 single column.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAuthClient } from "@hesya/auth/client";

const authClient = createAuthClient();

export interface EmailPasswordLabels {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  signingIn: string;
  errorInvalidCredentials: string;
  errorInvalidEmail: string;
}

interface Props {
  locale: string;
  labels: EmailPasswordLabels;
  /** preview/dev 환경에서 데모 자격증명 자동 채움 (prod에선 off). */
  demoEmail?: string;
  demoPassword?: string;
}

export function EmailPasswordForm({
  locale,
  labels,
  demoEmail,
  demoPassword,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(demoEmail ?? "");
  const [password, setPassword] = useState(demoPassword ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError(labels.errorInvalidEmail);
      return;
    }
    if (!password) {
      setError(labels.errorInvalidCredentials);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: `/${locale}/c/mypage`,
      });
      if (result.error) {
        setError(labels.errorInvalidCredentials);
        return;
      }
      router.push(`/${locale}/c/mypage`);
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

      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.16em] text-hesya-navy-900/70">
          {labels.passwordLabel}
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={labels.passwordPlaceholder}
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
        {isPending ? labels.signingIn : labels.submit}
      </button>
    </form>
  );
}
