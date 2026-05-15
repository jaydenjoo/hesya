"use client";

/**
 * 매장 매니저 sign-in form (Client).
 *
 * Primary: email + password 즉시 로그인 (Better Auth signInEmail — Set-Cookie 자동).
 * Secondary: 비밀번호 모를 시 같은 email로 magic link 발송 (link 클릭).
 *
 * 디자인은 reference (`docs/design/reference/login-store-app.jsx`) 정합 —
 * floating-label `sl-field` + 비밀번호 reveal + 자동 로그인 row + amber CTA.
 */

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { createAuthClient } from "@hesya/auth/client";
import { ownerMagicLinkSignInAction } from "@/app/[locale]/sign-in/actions";

const authClient = createAuthClient();

interface Props {
  locale: string;
  callbackUrl: string;
  /** preview/dev 환경에서 데모 자격증명 자동 채움 (prod에선 off) */
  demoEmail?: string;
  demoPassword?: string;
}

export function OwnerSignInForm({
  locale,
  callbackUrl,
  demoEmail,
  demoPassword,
}: Props) {
  const router = useRouter();
  const emailId = useId();
  const pwId = useId();
  const [email, setEmail] = useState(demoEmail ?? "");
  const [password, setPassword] = useState(demoPassword ?? "");
  const [reveal, setReveal] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [magicSending, setMagicSending] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("올바른 이메일을 입력해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: callbackUrl,
        rememberMe: remember,
      });
      if (result.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  };

  const handleMagicLink = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("올바른 이메일을 입력해주세요.");
      return;
    }
    setError(null);
    setMagicSending(true);
    const result = await ownerMagicLinkSignInAction({
      email: email.trim(),
      locale,
      callbackUrl,
    });
    if (!result.ok) {
      setError(result.message ?? "이메일을 다시 확인해주세요.");
      setMagicSending(false);
      return;
    }
    router.push(
      `/${locale}/sign-in/sent?email=${encodeURIComponent(email.trim())}`,
    );
  };

  return (
    <form onSubmit={handlePasswordSubmit}>
      <div className="sl-field">
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=" "
          className="sl-field-input"
        />
        <label htmlFor={emailId} className="sl-field-label">
          이메일
        </label>
      </div>

      <div className="sl-field">
        <input
          id={pwId}
          type={reveal ? "text" : "password"}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" "
          className="sl-field-input"
          style={{ paddingRight: "60px" }}
        />
        <label htmlFor={pwId} className="sl-field-label">
          비밀번호
        </label>
        <button
          type="button"
          className="sl-field-reveal"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? "비밀번호 숨기기" : "비밀번호 보기"}
        >
          {reveal ? "숨기기" : "보기"}
        </button>
      </div>

      <div className="sl-row">
        <label className="sl-checkbox">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className="sl-checkbox-box" />
          <span>자동 로그인</span>
        </label>
        <button
          type="button"
          className="sl-link"
          onClick={handleMagicLink}
          disabled={magicSending || isPending}
        >
          {magicSending ? "발송 중..." : "비밀번호 찾기 →"}
        </button>
      </div>

      {error && (
        <p role="alert" className="sl-magic-error">
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending} className="sl-btn-primary">
        {isPending ? "로그인 중..." : "로그인"}
        <span className="sl-btn-primary-arrow">→</span>
      </button>
    </form>
  );
}
