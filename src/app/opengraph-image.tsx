import { ImageResponse } from "next/og";

// Powers the og:image/twitter:image meta tags for every page that doesn't
// override this (Next.js picks this file up automatically for the root
// segment) — this is what renders when the app's link is pasted into
// Slack, iMessage, Twitter/X, Canva's "paste a link" embed, etc. Without
// it, those surfaces fall back to a bare text card with no image at all.

export const alt = "Tally — Personal Expense Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same green/near-black palette as the app's own dark theme (see
// globals.css's :root[data-theme="dark"] block) — a link-preview card
// renders on every possible surface color, so it needs to carry its own
// background rather than relying on the app's actual theme tokens.
const BG = "#0a130f";
const BG_SOFT = "#101f17";
const ACCENT = "#6fd7ab";
const FOREGROUND = "#eef4ef";
const MUTED = "#9db3a4";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(circle at 88% 18%, ${BG_SOFT} 0%, ${BG} 55%)`,
          fontFamily: "sans-serif",
        }}
      >
        {/* Soft accent glow, purely decorative — echoes the "T" mark's color
         * without competing with the text. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -140,
            right: -140,
            width: 480,
            height: 480,
            borderRadius: 480,
            backgroundColor: ACCENT,
            opacity: 0.14,
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 104,
            height: 104,
            borderRadius: 28,
            backgroundColor: ACCENT,
            color: BG,
            fontSize: 56,
            fontWeight: 700,
            marginBottom: 44,
          }}
        >
          T
        </div>

        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, color: FOREGROUND, letterSpacing: -2 }}>Tally</div>

        <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: MUTED, maxWidth: 820, lineHeight: 1.4 }}>
          A private, personal expense tracker with receipt scanning and voice entry.
        </div>
      </div>
    ),
    { ...size },
  );
}
