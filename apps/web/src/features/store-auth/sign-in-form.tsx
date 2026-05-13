"use client";

/**
 * 매장 매니저 magic link sign-in form (Client).
 *
 * email 입력 → server action 호출 → ok 응답 시 /{locale}/sign-in/sent로 navigate.
 * 디자인은 owner sign-in 페이지(sign-in.css `sl-*` 톤)와 어울리도록 인라인 + sl-* 재활용.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ownerMagicLinkSignInAction } from "@/app/[locale]/sign-in/actions";

interface Props {
  locale: string;
  callbackUrl: string;
}

export function OwnerSignInForm({ locale, callbackUrl }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("올바른 이메일을 입력해주세요.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await ownerMagicLinkSignInAction({
        email: email.trim(),
        locale,
        callbackUrl,
      });
      if (!result.ok) {
        setError(result.message ?? "이메일을 다시 확인해주세요.");
        return;
      }
      router.push(
        `/${locale}/sign-in/sent?email=${encodeURIComponent(email.trim())}`,
      );
    });
  };

  return (
    <form onSubmit={handleSubmit} className="sl-magic">
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
      {error && (
        <p role="alert" className="sl-magic-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={isPending} className="sl-btn-magic">
        {isPending ? "전송 중..." : "이메일로 로그인 링크 받기"}
      </button>
    </form>
  );
}
