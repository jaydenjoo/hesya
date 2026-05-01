import type { ReactNode } from "react";

type IosFrameProps = {
  children: ReactNode;
  className?: string;
  /** Optional clock label rendered in the simulated status bar. */
  clock?: string;
};

/**
 * IosFrame — wraps customer-PWA pages in an iPhone-shaped chrome for
 * design review at desktop widths (handoff v1.0 ios-frame.jsx).
 *
 * Development preview only: production PWA renders edge-to-edge in the
 * mobile viewport, no frame. The frame just embeds the page in a
 * 390×844 (iPhone 15) outer container with rounded corners + safe-area
 * status bar so designers/Jayden can sanity-check page composition
 * without leaving Chrome.
 */
export function IosFrame({
  children,
  className,
  clock = "9:41",
}: IosFrameProps) {
  return (
    <div
      data-component="ios-frame"
      className={className}
      style={{
        width: 390,
        height: 844,
        borderRadius: 48,
        overflow: "hidden",
        boxShadow:
          "0 8px 16px rgba(26,34,56,.10), 0 24px 64px rgba(26,34,56,.16)",
        border: "1px solid var(--color-border)",
        background: "var(--color-background)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        aria-hidden
        style={{
          height: 44,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-foreground)",
        }}
      >
        <span>{clock}</span>
        <span>● ● ●</span>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
    </div>
  );
}
