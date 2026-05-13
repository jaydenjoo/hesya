/**
 * 매장 매니저 magic link 발송 완료 안내 페이지.
 *
 * /sign-in 폼 제출 직후 redirect 대상. email query로 어디로 보냈는지 표시.
 * 사장이 메일 받고 링크 클릭하면 /api/auth/magic-link/verify가 verify 후
 * callbackURL(=/{locale}/store/dashboard 또는 deep link)로 redirect.
 */
import Link from "next/link";
import "../sign-in.css";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function OwnerSignInSentPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { email } = await searchParams;
  const displayEmail = email && email.includes("@") ? email : "입력하신 이메일";

  return (
    <div className="sl-app" data-screen-label="Store Login — Sent">
      <main className="sl-form sl-form-center">
        <div className="sl-magic-sent">
          <div aria-hidden="true" className="sl-magic-sent-icon">
            ✉️
          </div>
          <h1 className="sl-h-title">
            메일을 <em>확인해주세요</em>
          </h1>
          <p className="sl-h-body">
            <strong>{displayEmail}</strong> 으로 로그인 링크를 보냈습니다.
            <br />
            메일 안의 버튼을 클릭하면 매장 대시보드로 이동합니다.
          </p>
          <p className="sl-magic-sent-note">
            메일이 안 오면 스팸함도 확인해 보세요. 링크는 15분 후 만료됩니다.
          </p>
          <Link href={`/${locale}/sign-in`} className="sl-magic-sent-back">
            ← 다시 로그인
          </Link>
        </div>
      </main>
    </div>
  );
}
