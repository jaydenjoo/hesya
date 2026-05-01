import type { ReactNode } from "react";

export type AiFlowStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
};

type AiFlowProps = {
  steps: AiFlowStep[];
  className?: string;
  children?: ReactNode;
};

/**
 * AiFlow — visualises the step-by-step AI translation/response pipeline
 * shared across Inbox, Chat, and Photo Analysis (handoff v1.0 ai-flow-app.jsx).
 *
 * Phase 1A ships this stub to lock in the type contract; the full visual
 * (animated connectors, per-step model badges, latency timeline) lands when
 * Inbox lands E1-7 (Claude Sonnet 4.6 auto-response).
 */
export function AiFlow({ steps, className, children }: AiFlowProps) {
  return (
    <div className={className} data-component="ai-flow">
      <ol className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            data-status={step.status}
            className="flex items-center gap-3 text-sm"
          >
            <span
              aria-hidden
              className="inline-block size-2 rounded-full bg-current opacity-70"
            />
            <span className="font-medium">{step.label}</span>
            {step.detail ? (
              <span className="text-muted-foreground">— {step.detail}</span>
            ) : null}
          </li>
        ))}
      </ol>
      {children}
    </div>
  );
}
