"use client";

import { useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

const NAV_LINKS = [
  { href: "#travelers", label: "For travelers" },
  { href: "#salons", label: "For salons" },
  { href: "#reviews", label: "Reviews" },
  { href: "#safety", label: "Safety" },
  { href: "#about", label: "About" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 32);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center bg-hesya-peach-50/[0.82] transition-[height,box-shadow] duration-200 [backdrop-filter:blur(14px)_saturate(140%)] ${
        scrolled ? "h-16 shadow-[0_1px_12px_rgba(26,34,56,0.06)]" : "h-20"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-8 px-8">
        <a
          href="#"
          className="font-heading text-[26px] font-semibold italic tracking-tight text-hesya-navy-900"
        >
          Hesya
        </a>
        <nav
          aria-label="Primary"
          className="mx-auto hidden items-center gap-8 lg:flex"
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-hesya-navy-700 transition hover:text-hesya-navy-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Choose language"
            className="hidden items-center gap-1 rounded-full bg-white/50 px-3 py-1.5 text-xs text-hesya-navy-700 transition hover:bg-white sm:inline-flex"
          >
            <span aria-hidden="true">🌐</span> EN
          </button>
          <Link
            href="/sign-in"
            className="hidden text-sm text-hesya-navy-700 transition hover:text-hesya-navy-900 sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/c"
            className="inline-flex h-10 items-center rounded-full bg-hesya-amber-500 px-5 text-sm font-bold text-hesya-navy-900 transition hover:bg-hesya-amber-600 hover:shadow"
          >
            Get the app →
          </Link>
        </div>
      </div>
    </header>
  );
}
