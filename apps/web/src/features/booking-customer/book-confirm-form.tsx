"use client";

import { useState } from "react";

import { useRouter } from "@/i18n/navigation";

export interface ConfirmFormLabels {
  readonly formHeading: string;
  readonly nameLabel: string;
  readonly namePlaceholder: string;
  readonly emailLabel: string;
  readonly emailPlaceholder: string;
  readonly messageLabel: string;
  readonly messagePlaceholder: string;
  readonly submit: string;
  readonly required: string;
  readonly privacyNote: string;
  readonly incomplete: string;
}

interface Props {
  readonly storeId: string;
  readonly transit: {
    readonly service: string;
    readonly staff: string;
    readonly date: string;
    readonly time: string;
  };
  readonly labels: ConfirmFormLabels;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BookConfirmForm({ storeId, transit, labels }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const valid = name.trim().length > 0 && EMAIL_RE.test(email.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const params = new URLSearchParams({
      service: transit.service,
      staff: transit.staff,
      date: transit.date,
      time: transit.time,
      name: name.trim(),
      email: email.trim(),
    });
    if (message.trim()) {
      params.set("message", message.trim());
    }
    router.push(`/c/store/${storeId}/pay?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-sm font-semibold text-hesya-navy-900">
        {labels.formHeading}
      </h2>

      <div>
        <label
          htmlFor="bookerName"
          className="mb-1.5 block text-xs font-medium text-hesya-navy-900"
        >
          {labels.nameLabel} <span className="text-hesya-amber-600">*</span>
        </label>
        <input
          id="bookerName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={labels.namePlaceholder}
          required
          className="w-full rounded-xl border border-hesya-peach-200 bg-white px-4 py-2.5 text-sm text-hesya-navy-900 placeholder:text-hesya-navy-900/35 focus:border-hesya-navy-900 focus:outline-none focus:ring-2 focus:ring-hesya-amber-200"
        />
      </div>

      <div>
        <label
          htmlFor="bookerEmail"
          className="mb-1.5 block text-xs font-medium text-hesya-navy-900"
        >
          {labels.emailLabel} <span className="text-hesya-amber-600">*</span>
        </label>
        <input
          id="bookerEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.emailPlaceholder}
          required
          className="w-full rounded-xl border border-hesya-peach-200 bg-white px-4 py-2.5 text-sm text-hesya-navy-900 placeholder:text-hesya-navy-900/35 focus:border-hesya-navy-900 focus:outline-none focus:ring-2 focus:ring-hesya-amber-200"
        />
      </div>

      <div>
        <label
          htmlFor="bookerMessage"
          className="mb-1.5 block text-xs font-medium text-hesya-navy-900"
        >
          {labels.messageLabel}
        </label>
        <textarea
          id="bookerMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={labels.messagePlaceholder}
          rows={3}
          className="w-full rounded-xl border border-hesya-peach-200 bg-white px-4 py-2.5 text-sm text-hesya-navy-900 placeholder:text-hesya-navy-900/35 focus:border-hesya-navy-900 focus:outline-none focus:ring-2 focus:ring-hesya-amber-200"
        />
      </div>

      <p className="text-[11px] text-hesya-navy-900/55">{labels.privacyNote}</p>

      <button
        type="submit"
        disabled={!valid}
        className={`w-full rounded-full px-6 py-3 text-sm font-semibold transition ${
          valid
            ? "bg-hesya-navy-900 text-hesya-peach-50 hover:bg-hesya-navy-800"
            : "cursor-not-allowed bg-hesya-peach-200/60 text-hesya-navy-900/40"
        }`}
      >
        {valid ? labels.submit : labels.incomplete}
      </button>
    </form>
  );
}
