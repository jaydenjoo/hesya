import { LOCALES, type Locale } from "@hesya/translations";
import { PostHogPageView, PostHogProvider } from "@posthog/next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Hesya",
  description: "한국 미용실, 외국인을 위한 6개 언어 환대 시스템",
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);

  return (
    <html
      lang={locale}
      className={cn(
        "h-full",
        "antialiased",
        fraunces.variable,
        jetbrainsMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider
          apiKey={process.env.NEXT_PUBLIC_POSTHOG_KEY}
          clientOptions={{
            api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            respect_dnt: true,
            // 베타 5곳 단계 — pageview만 capture. autocapture 925ms 비용 회피.
            // Heatmap / session recording / dead-clicks는 베타 운영 1개월 후 가치 재평가.
            autocapture: false,
            capture_dead_clicks: false,
            capture_heatmaps: false,
            disable_session_recording: true,
            // 익명 user profile 생성 안 함 — identified_only로 person/event row 절감.
            person_profiles: "identified_only",
          }}
        >
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
