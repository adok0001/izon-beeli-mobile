"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** Accent colour that glows on the door seam — matches the level palette */
  accentColor?: string;
  children: React.ReactNode;
}

export function DoorTransition({ accentColor = "rgb(139 92 246)", children }: Props) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    const seam = seamRef.current;
    const container = containerRef.current;
    if (!left || !right || !seam || !container) return;

    // Kick off the swing on the next frame so the browser paints the closed state first
    const raf = requestAnimationFrame(() => {
      left.style.transform = "perspective(1400px) rotateY(-88deg)";
      right.style.transform = "perspective(1400px) rotateY(88deg)";
      seam.style.opacity = "0";
    });

    const cleanup = setTimeout(() => {
      container.style.pointerEvents = "none";
      container.style.opacity = "0";
    }, 780);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(cleanup);
    };
  }, []);

  return (
    <>
      {/* Door overlay — sits above the page content */}
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 transition-opacity duration-150"
        style={{ transitionDelay: "680ms" }}
        aria-hidden
      >
        {/* Shared perspective wrapper */}
        <div className="absolute inset-0 flex" style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}>
          {/* Left panel */}
          <div
            ref={leftRef}
            className="relative w-1/2 h-full door-panel"
            style={{
              transformOrigin: "0% 50%",
              transform: "perspective(1400px) rotateY(0deg)",
              transition: "transform 680ms cubic-bezier(0.65, 0, 0.35, 1)",
              background: "linear-gradient(160deg, #1a1228 0%, #0e0c1a 100%)",
              borderRight: `1px solid ${accentColor.replace(")", " / 0.1)").replace("rgb", "rgb")}`,
            }}
          >
            <DoorTexture side="left" accentColor={accentColor} />
            {/* Handle */}
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
            >
              <div
                className="w-[6px] h-10 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, #e2e8f0, #64748b)",
                  boxShadow: "0 2px 8px rgb(0 0 0 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.3)",
                }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 30%, #e2e8f0, #475569)",
                  boxShadow: `0 0 10px -2px ${accentColor.replace(")", " / 0.6)").replace("rgb", "rgb")}, 0 2px 6px rgb(0 0 0 / 0.5)`,
                }}
              />
            </div>
          </div>

          {/* Right panel */}
          <div
            ref={rightRef}
            className="relative w-1/2 h-full door-panel"
            style={{
              transformOrigin: "100% 50%",
              transform: "perspective(1400px) rotateY(0deg)",
              transition: "transform 680ms cubic-bezier(0.65, 0, 0.35, 1)",
              background: "linear-gradient(200deg, #1a1228 0%, #0e0c1a 100%)",
              borderLeft: `1px solid ${accentColor.replace(")", " / 0.1)").replace("rgb", "rgb")}`,
            }}
          >
            <DoorTexture side="right" accentColor={accentColor} />
            {/* Handle */}
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
            >
              <div
                className="w-[6px] h-10 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, #e2e8f0, #64748b)",
                  boxShadow: "0 2px 8px rgb(0 0 0 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.3)",
                }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 30%, #e2e8f0, #475569)",
                  boxShadow: `0 0 10px -2px ${accentColor.replace(")", " / 0.6)").replace("rgb", "rgb")}, 0 2px 6px rgb(0 0 0 / 0.5)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Centre seam glow */}
        <div
          ref={seamRef}
          className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] transition-opacity duration-200"
          style={{
            background: accentColor,
            boxShadow: `0 0 24px 6px ${accentColor.replace(")", " / 0.6)").replace("rgb", "rgb")}`,
            transitionDelay: "400ms",
          }}
        />
      </div>

      {children}

      <style>{`
        .door-panel {
          backface-visibility: hidden;
          will-change: transform;
        }
      `}</style>
    </>
  );
}

// ── Decorative door texture ───────────────────────────────────

function DoorTexture({ side, accentColor }: { side: "left" | "right"; accentColor: string }) {
  const isLeft = side === "left";
  return (
    <div className="absolute inset-0 overflow-hidden opacity-60" aria-hidden>
      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />
      {/* Panel inset rectangle */}
      <div
        className="absolute rounded-sm"
        style={{
          top: "12%", bottom: "12%",
          left: isLeft ? "8%" : "4%",
          right: isLeft ? "4%" : "8%",
          border: `1px solid ${accentColor.replace(")", " / 0.08)").replace("rgb", "rgb")}`,
          background: "rgb(255 255 255 / 0.015)",
        }}
      />
      {/* Top panel sub-inset */}
      <div
        className="absolute rounded-sm"
        style={{
          top: "14%", height: "32%",
          left: isLeft ? "11%" : "7%",
          right: isLeft ? "7%" : "11%",
          border: `1px solid ${accentColor.replace(")", " / 0.06)").replace("rgb", "rgb")}`,
        }}
      />
      {/* Bottom panel sub-inset */}
      <div
        className="absolute rounded-sm"
        style={{
          bottom: "14%", height: "36%",
          left: isLeft ? "11%" : "7%",
          right: isLeft ? "7%" : "11%",
          border: `1px solid ${accentColor.replace(")", " / 0.06)").replace("rgb", "rgb")}`,
        }}
      />
    </div>
  );
}
