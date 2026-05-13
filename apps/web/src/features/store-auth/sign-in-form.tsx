"use client";

/**
 * 매장 매니저 sign-in form (Client).
 *
 * Primary: email + password 즉시 로그인 (Better Auth signInEmail — Set-Cookie 자동).
 * Secondary: 비밀번호 모를 시 같은 email로 magic link 발송 (link 클릭).
 *
 * 디자인은 owner sign-in 페이지(sign-in.css `sl-*` 톤) 일관.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const [email, setEmail] = useState(demoEmail ?? "");
  const [password, setPassword] = useState(demoPassword ?? "");
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
    <form onSubmit={handlePasswordSubmit} className="sl-magic">
      <label className="sl-magic-label">
        <span>이메일</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="manager@yourstore.com"
          className="sl-magic-input"
        />
      </label>
      <label className="sl-magic-label">
        <span>비밀번호</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="sl-magic-input"
        />
      </label>
      {error && (
        <p role="alert" className="sl-magic-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={isPending} className="sl-btn-magic">
        {isPending ? "로그인 중..." : "로그인"}
      </button>
      <button
        type="button"
        onClick={handleMagicLink}
        disabled={magicSending || isPending}
        className="sl-magic-link"
      >
        {magicSending
          ? "발송 중..."
          : "비밀번호 대신 이메일로 로그인 링크 받기"}
      </button>
    </form>
  );
}
