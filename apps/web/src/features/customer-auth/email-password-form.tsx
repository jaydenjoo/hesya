"use client";

/**
 * Customer email + password sign-in form (Client).
 *
 * 외국인 손님용 즉시 로그인. Better Auth `signIn.email` 호출 → Set-Cookie 자동 →
 * /{locale}/c/mypage로 navigate.
 *
 * 디자인: docs/design/reference/login.css `.email-field` + `.primary-cta` —
 * floating-label + amber CTA + 14px radius.
 */

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
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
  emailHint?: string;
  backLabel?: string;
}

interface Props {
  locale: string;
  labels: EmailPasswordLabels;
  /** "Back to social sign-in" 버튼 노출 시 콜백 (2-step flow). undefined면 버튼 숨김. */
  onBack?: () => void;
  /** preview/dev 환경에서 데모 자격증명 자동 채움 (prod에선 off). */
  demoEmail?: string;
  demoPassword?: string;
}

export function EmailPasswordForm({
  locale,
  labels,
  onBack,
  demoEmail,
  demoPassword,
}: Props) {
  const router = useRouter();
  const emailId = useId();
  const pwId = useId();
  const [email, setEmail] = useState(demoEmail ?? "");
  const [password, setPassword] = useState(demoPassword ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = email.includes("@") && password.length > 0;

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
    <form onSubmit={handleSubmit} className="c-auth-stack c-email-form">
      <div className="c-email-field">
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=" "
        />
        <label htmlFor={emailId}>{labels.emailLabel}</label>
      </div>

      <div className="c-pw-field">
        <input
          id={pwId}
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" "
        />
        <label htmlFor={pwId}>{labels.passwordLabel}</label>
      </div>

      {error && (
        <p role="alert" className="c-email-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || isPending}
        className="c-primary-cta"
      >
        {isPending ? labels.signingIn : labels.submit}
      </button>

      {labels.emailHint && <p className="c-email-hint">{labels.emailHint}</p>}

      {onBack && (
        <button type="button" onClick={onBack} className="c-back-link">
          ← {labels.backLabel ?? "Back"}
        </button>
      )}
    </form>
  );
}
