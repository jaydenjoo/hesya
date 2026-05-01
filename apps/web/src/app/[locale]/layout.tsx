import { LOCALES, type Locale } from "@hesya/translations";
import { PostHogPageView, PostHogProvider } from "@posthog/next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Source_Sans_3 } from "next/font/google";
import { Suspense } from "react";
import "../globals.css";
import { env } from "@/shared/config/env";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
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
        sourceSans.variable,
        jetbrainsMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider
          apiKey={env.NEXT_PUBLIC_POSTHOG_KEY}
          clientOptions={{
            api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
            respect_dnt: true,
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
