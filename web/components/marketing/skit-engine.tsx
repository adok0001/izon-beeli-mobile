"use client";

// skit-engine.tsx — shared animation engine for the Beeli marketing skits.
// Trimmed timeline/sprite engine extracted from the Claude Design prototypes so the
// individual skits (Izon, 4-vs-70, Challenge, Educator, Preservation) don't each
// re-inline it. Self-contained; renders a stage that scales to fill its parent.

import React from "react";

/* ─────────────────────────────  EASINGS / MATH  ───────────────────────────── */
export type EaseFn = (t: number) => number;

export const Easing: Record<string, EaseFn> = {
  linear: (t) => t,
  easeOutQuad: (t) => t * (2 - t),
  easeInQuad: (t) => t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInCubic: (t) => t * t * t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t) => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function interpolate(input: number[], output: number[], ease: EaseFn | EaseFn[] = Easing.linear) {
  return (t: number) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? ease[i] || Easing.linear : ease;
        return output[i] + (output[i + 1] - output[i]) * easeFn(local);
      }
    }
    return output[output.length - 1];
  };
}

export function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = Easing.easeInOutCubic,
}: {
  from?: number;
  to?: number;
  start?: number;
  end?: number;
  ease?: EaseFn;
}) {
  return (t: number) => {
    if (t <= start) return from;
    if (t >= end) return to;
    return from + (to - from) * ease((t - start) / (end - start));
  };
}

/** pop helper: returns {opacity, scale, y} for an element appearing at `appear`. */
export function pop(localTime: number, appear: number, dur = 0.5, riseY = 26) {
  const t = clamp((localTime - appear) / dur, 0, 1);
  const e = Easing.easeOutBack(t);
  return {
    opacity: clamp((localTime - appear) / (dur * 0.6), 0, 1),
    scale: 0.86 + 0.14 * e,
    y: (1 - Easing.easeOutCubic(t)) * riseY,
  };
}

/* small colour mixer for warmth transitions */
export function mix(a: string, b: string, t: number) {
  const pa = hx(a),
    pb = hx(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t),
    g = Math.round(pa[1] + (pb[1] - pa[1]) * t),
    bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
export function hx(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ─────────────────────────────  PALETTE & TYPE  ───────────────────────────── */
export type Palette = Record<string, string>;

// Shared Izon colour symbolism: kwa-kwa (red), pena-pena (white/light), toru (river).
export const BASE_PALETTE: Palette = {
  cream: "#F4ECD9",
  cream2: "#E7D9BD",
  paper: "#FBF6EA",
  ink: "#1B1813",
  ink2: "#2A251D",
  red: "#C2452E",
  redHi: "#D9614A",
  river: "#155E63",
  riverHi: "#2C8E84",
  riverDeep: "#0E3E44",
  gold: "#E3A52C",
  goldHi: "#F2C45A",
  cool: "#2D333B",
  cool2: "#3C434D",
  coolHi: "#525B66",
};

// Families come from the route/section's next/font CSS variables, falling back to the
// prototype's Google fonts then the system stack.
export const DISPLAY = "var(--font-skit-display), 'Bricolage Grotesque', system-ui, sans-serif";
export const TEXT = "var(--font-skit-text), 'Hanken Grotesk', system-ui, sans-serif";
export const MONO = "var(--font-skit-text), 'Hanken Grotesk', ui-monospace, monospace";
export const SERIF = "'Noto Serif Ethiopic', 'Hanken Grotesk', serif";
export const W = 1080,
  H = 1920;

/* ─────────────────────────────  TIMELINE / SPRITE  ───────────────────────────── */
type TimelineValue = { time: number; duration: number; playing: boolean };
const TimelineContext = React.createContext<TimelineValue>({ time: 0, duration: 32, playing: false });
export const useTimeline = () => React.useContext(TimelineContext);

type SpriteValue = { localTime: number; progress: number; duration: number; visible: boolean };
type SpriteChildren = React.ReactNode | ((v: SpriteValue) => React.ReactNode);

export function Sprite({
  start = 0,
  end = Infinity,
  children,
  keepMounted = false,
}: {
  start?: number;
  end?: number;
  children: SpriteChildren;
  keepMounted?: boolean;
}) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;
  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;
  const value: SpriteValue = { localTime, progress, duration, visible };
  return <>{typeof children === "function" ? children(value) : children}</>;
}

export function Stage({
  width = 1080,
  height = 1920,
  duration = 32,
  background = "#0a0a0a",
  loop = true,
  autoplay = true,
  persistKey = "skit",
  children,
}: {
  width?: number;
  height?: number;
  duration?: number;
  background?: string;
  loop?: boolean;
  autoplay?: boolean;
  persistKey?: string;
  children: React.ReactNode;
}) {
  const [time, setTime] = React.useState<number>(() => {
    try {
      const v = parseFloat(localStorage.getItem(persistKey + ":t") || "0");
      return isFinite(v) ? clamp(v, 0, duration) : 0;
    } catch {
      return 0;
    }
  });
  const [playing, setPlaying] = React.useState(autoplay);
  const [hoverTime, setHoverTime] = React.useState<number | null>(null);
  const [scale, setScale] = React.useState(1);
  const stageRef = React.useRef<HTMLDivElement>(null),
    rafRef = React.useRef<number | null>(null),
    lastTsRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    try {
      localStorage.setItem(persistKey + ":t", String(time));
    } catch {
      /* ignore */
    }
  }, [time, persistKey]);
  React.useEffect(() => {
    if (!stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const barH = 44;
      setScale(Math.max(0.05, Math.min(el.clientWidth / width, (el.clientHeight - barH) / height)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [width, height]);
  React.useEffect(() => {
    if (!playing) {
      lastTsRef.current = null;
      return;
    }
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) {
          if (loop) next = next % duration;
          else {
            next = duration;
            setPlaying(false);
          }
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [playing, duration, loop]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.code === "ArrowLeft") setTime((t) => clamp(t - (e.shiftKey ? 1 : 0.1), 0, duration));
      else if (e.code === "ArrowRight") setTime((t) => clamp(t + (e.shiftKey ? 1 : 0.1), 0, duration));
      else if (e.key === "0" || e.code === "Home") setTime(0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duration]);
  const displayTime = hoverTime != null ? hoverTime : time;
  const ctxValue = React.useMemo(
    () => ({ time: displayTime, duration, playing }),
    [displayTime, duration, playing],
  );
  return (
    <div ref={stageRef} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", background: "#0a0a0a" }}>
      <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: 0 }}>
        <div
          style={{
            width,
            height,
            background,
            position: "relative",
            transform: `scale(${scale})`,
            transformOrigin: "center",
            flexShrink: 0,
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            overflow: "hidden",
          }}
        >
          <TimelineContext.Provider value={ctxValue}>{children}</TimelineContext.Provider>
        </div>
      </div>
      <PlaybackBar
        time={displayTime}
        duration={duration}
        playing={playing}
        onPlayPause={() => setPlaying((p) => !p)}
        onReset={() => setTime(0)}
        onSeek={(t) => setTime(t)}
        onHover={(t) => setHoverTime(t)}
      />
    </div>
  );
}

function PlaybackBar({
  time,
  duration,
  playing,
  onPlayPause,
  onReset,
  onSeek,
  onHover,
}: {
  time: number;
  duration: number;
  playing: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onSeek: (t: number) => void;
  onHover: (t: number | null) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const timeFromEvent = React.useCallback(
    (e: { clientX: number }) => {
      const r = trackRef.current!.getBoundingClientRect();
      return clamp((e.clientX - r.left) / r.width, 0, 1) * duration;
    },
    [duration],
  );
  React.useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(false);
    const onMove = (e: MouseEvent) => {
      if (trackRef.current) onSeek(timeFromEvent(e));
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, [dragging, timeFromEvent, onSeek]);
  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t: number) => {
    const m = Math.floor(Math.max(0, t) / 60),
      s = Math.floor(Math.max(0, t) % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  const mono = "ui-monospace, monospace";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        background: "rgba(20,20,20,0.92)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        width: "100%",
        maxWidth: 680,
        borderRadius: 8,
        color: "#f6f4ef",
        userSelect: "none",
        flexShrink: 0,
        fontFamily: "Hanken Grotesk, system-ui, sans-serif",
      }}
    >
      <button onClick={onReset} title="Restart (0)" style={btnStyle}>
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
        </svg>
      </button>
      <button onClick={onPlayPause} title="Play/pause (space)" style={btnStyle}>
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="3" y="2" width="3" height="10" fill="currentColor" />
            <rect x="8" y="2" width="3" height="10" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div style={{ fontFamily: mono, fontSize: 12, width: 44, textAlign: "right" }}>{fmt(time)}</div>
      <div
        ref={trackRef}
        onMouseMove={(e) => {
          if (dragging) onSeek(timeFromEvent(e));
          else onHover(timeFromEvent(e));
        }}
        onMouseLeave={() => {
          if (!dragging) onHover(null);
        }}
        onMouseDown={(e) => {
          setDragging(true);
          onSeek(timeFromEvent(e));
        }}
        style={{ flex: 1, height: 22, position: "relative", cursor: "pointer", display: "flex", alignItems: "center" }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.12)", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 4, background: "#E3A52C", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: `${pct}%`, top: "50%", width: 12, height: 12, marginLeft: -6, marginTop: -6, background: "#fff", borderRadius: 6 }} />
      </div>
      <div style={{ fontFamily: mono, fontSize: 12, width: 44, color: "rgba(246,244,239,0.55)" }}>{fmt(duration)}</div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  color: "#f6f4ef",
  cursor: "pointer",
  padding: 0,
};

/* ─────────────────────────────  SHARED PRIMITIVES  ───────────────────────────── */
export function Scene({
  start,
  end,
  children,
  fade = 0.45,
}: {
  start: number;
  end: number;
  children: (v: { localTime: number; duration: number }) => React.ReactNode;
  fade?: number;
}) {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const out = Math.max(0, duration - fade);
        let o = 1;
        if (localTime < fade) o = clamp(localTime / fade, 0, 1);
        else if (localTime > out) o = 1 - clamp((localTime - out) / fade, 0, 1);
        return <div style={{ position: "absolute", inset: 0, opacity: o, overflow: "hidden" }}>{children({ localTime, duration })}</div>;
      }}
    </Sprite>
  );
}

export function BeeliMark({
  size = 120,
  color = "#1B1813",
  accent = "#C2452E",
  t = 0,
  animated = false,
}: {
  size?: number;
  color?: string;
  accent?: string;
  t?: number;
  animated?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: size * 0.22 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: size * 0.08, height: size * 0.74, paddingBottom: size * 0.06 }}>
        {[0, 1, 2].map((i) => {
          const v = animated ? 0.4 + 0.6 * 0.5 * (1 + Math.sin(t * 5 + i)) : [0.55, 1, 0.7][i];
          return <div key={i} style={{ width: size * 0.12, height: `${clamp(v, 0.25, 1) * 100}%`, background: accent, borderRadius: 999 }} />;
        })}
      </div>
      <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size, color, letterSpacing: "-0.03em", lineHeight: 0.9 }}>beeli</span>
    </div>
  );
}

export function TimeLabel() {
  const { time } = useTimeline();
  return <div data-screen-label={`t=${time.toFixed(1)}s`} style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }} />;
}
