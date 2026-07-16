import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Beeli (Aurufie) — African Language Learning";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #05050c 0%, #0f0f2a 60%, #1a0a30 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(100,80,200,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,80,200,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(99,60,220,0.35) 0%, transparent 70%)",
          }}
        />

        {/* App icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "linear-gradient(135deg, #7c5ff0 0%, #5b3ec7 50%, #3a1f9e 100%)",
            marginBottom: 28,
            boxShadow: "0 0 48px rgba(99,60,220,0.7)",
          }}
        >
          {/* Simple globe mark (inline SVG — emoji don't render in OG images) */}
          <svg
            width="52"
            height="52"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>

        {/* App name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            Beeli
          </span>
          <span
            style={{
              fontSize: 36,
              fontWeight: 500,
              color: "rgba(180,160,255,0.9)",
              marginTop: 8,
              letterSpacing: "1px",
            }}
          >
            Aurufie
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 32,
            fontSize: 26,
            fontWeight: 400,
            color: "rgba(200,190,240,0.75)",
            letterSpacing: "0.5px",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Learn African languages. Preserve your heritage.
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "rgba(150,130,220,0.6)",
            letterSpacing: "1px",
          }}
        >
          izon-beeli.com
        </div>
      </div>
    ),
    { ...size }
  );
}
