"use client";

// skit-seventy-vs-four.tsx — "4 → 70" — a 15s vertical (9:16) hook for Beeli's category flag-plant.
// "Duolingo covers 4 African languages. Beeli covers 70." A stark number gap, then a cascading
// wall of real language names, then the CTA.

import React from "react";
import {
  BASE_PALETTE,
  BeeliMark,
  clamp,
  DISPLAY,
  H,
  type Palette,
  pop,
  Scene,
  Stage,
  TEXT,
  TimeLabel,
  W,
} from "@/components/marketing/skit-engine";

const C: Palette = BASE_PALETTE;

/* ─────────────────────────────  SCENE 1 · THE 4  ───────────────────────────── */
// Duolingo's actual four (per strategy Appendix B): Swahili, Zulu, Yoruba, Hausa.
const FOUR = ["Swahili", "Zulu", "Yoruba", "Hausa"];
function FourScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.3, 0.6, 18);
  const num = pop(lt, 1.1, 0.7, 24);
  const drift = 4 * Math.sin(lt * 1.1);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 32%, ${C.cool2}, ${C.cool} 72%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, textAlign: "center", width: 880, marginBottom: 30 }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 40, color: "rgba(244,236,217,0.78)", lineHeight: 1.25 }}>
          The world&apos;s biggest
          <br />
          language app teaches
        </div>
      </div>
      <div style={{ opacity: num.opacity, transform: `translateY(${num.y + drift}px) scale(${num.scale})`, fontFamily: DISPLAY, fontWeight: 800, fontSize: 540, color: C.coolHi, lineHeight: 0.8, letterSpacing: "-0.04em" }}>4</div>
      <div style={{ opacity: clamp((lt - 1.9) / 0.5, 0, 1), fontFamily: TEXT, fontWeight: 700, fontSize: 46, color: C.cream, marginTop: 20 }}>African languages.</div>
      <div style={{ display: "flex", gap: 16, marginTop: 54, flexWrap: "wrap", justifyContent: "center", maxWidth: 720 }}>
        {FOUR.map((n, i) => {
          const p = pop(lt, 2.4 + i * 0.16, 0.4, 12);
          return (
            <div key={n} style={{ opacity: p.opacity * 0.66, transform: `translateY(${p.y}px)`, fontFamily: TEXT, fontWeight: 600, fontSize: 34, color: "rgba(244,236,217,0.55)", border: "2px solid rgba(244,236,217,0.2)", borderRadius: 999, padding: "10px 26px" }}>
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 2 · THE 70  ───────────────────────────── */
// A breadth wall of real, specific languages on Beeli (never generic "African language").
const WALL: Array<[string, string, number]> = [
  ["Yoruba", C.gold, 64], ["Igbo", C.cream, 52], ["Swahili", C.goldHi, 58], ["Hausa", C.cream, 46],
  ["Amharic", C.gold, 50], ["Twi", C.cream, 44], ["Oromo", C.goldHi, 48], ["Ịzọn", C.gold, 56],
  ["Wolof", C.cream, 42], ["Somali", C.cream, 46], ["Zulu", C.goldHi, 44], ["Xhosa", C.cream, 40],
  ["Tigrinya", C.cream, 44], ["Tamazight", C.gold, 50], ["Bambara", C.cream, 42], ["Kinyarwanda", C.goldHi, 46],
  ["Luganda", C.cream, 40], ["Ewe", C.cream, 44], ["Shona", C.cream, 42], ["Fula", C.gold, 40],
  ["Kikuyu", C.cream, 40], ["Lingala", C.cream, 44], ["Chichewa", C.goldHi, 40], ["Nembe", C.cream, 42],
  ["Isoko", C.cream, 40], ["Urhobo", C.cream, 42], ["Efik", C.gold, 40], ["Tiv", C.cream, 44],
  ["Kanuri", C.cream, 40], ["Edo", C.cream, 42], ["Nupe", C.cream, 40], ["Idoma", C.cream, 40],
  ["Ndebele", C.goldHi, 40], ["Sesotho", C.cream, 40], ["Coptic", C.cream, 42], ["Khana", C.cream, 40],
];
function SeventyScene({ localTime: lt }: { localTime: number }) {
  const num = pop(lt, 0.2, 0.7, 30);
  const numScale = 1 + 0.02 * Math.sin(lt * 2.2);
  // wall fades up as a backdrop, names pop in fast staggered
  const wallReveal = clamp((lt - 1.3) / 2.2, 0, 1);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 26%, ${C.riverDeep}, ${C.ink} 78%)`, overflow: "hidden" }}>
      {/* breadth wall */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexWrap: "wrap", alignContent: "center", justifyContent: "center", gap: "14px 30px", padding: "120px 70px", opacity: wallReveal }}>
        {WALL.map(([n, col, sz], i) => {
          const p = pop(lt, 1.3 + i * 0.045, 0.42, 14);
          return (
            <span key={n} style={{ opacity: p.opacity * (i % 3 === 0 ? 0.95 : 0.72), transform: `translateY(${p.y}px)`, fontFamily: DISPLAY, fontWeight: 700, fontSize: sz, color: col, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              {n}
            </span>
          );
        })}
      </div>
      {/* dark scrim so the number reads */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 34% at 50% 40%, rgba(10,10,10,0.82), rgba(10,10,10,0) 70%)" }} />
      {/* the 70 */}
      <div style={{ position: "absolute", top: 470, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 40, color: "rgba(244,236,217,0.82)", opacity: clamp((lt - 0.1) / 0.5, 0, 1) }}>We built one that teaches</div>
        <div style={{ opacity: num.opacity, transform: `scale(${num.scale * numScale})`, fontFamily: DISPLAY, fontWeight: 800, fontSize: 560, color: C.gold, lineHeight: 0.78, letterSpacing: "-0.04em", textShadow: "0 24px 80px rgba(227,165,44,0.4)" }}>70</div>
        <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 48, color: C.cream, marginTop: 8, opacity: clamp((lt - 0.9) / 0.5, 0, 1) }}>African languages.</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 3 · CTA  ───────────────────────────── */
function CtaScene({ localTime: lt }: { localTime: number }) {
  const mark = pop(lt, 0.2, 0.6, 20);
  const tag = pop(lt, 0.8, 0.6, 16);
  const sub = pop(lt, 1.3, 0.6, 14);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(130% 90% at 50% 30%, ${C.ink2}, ${C.ink} 75%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
        <div style={{ flex: 1, background: C.red }} />
        <div style={{ flex: 1, background: C.cream }} />
        <div style={{ flex: 1, background: C.river }} />
      </div>
      <div style={{ transform: `translateY(${mark.y}px) scale(${mark.scale})`, opacity: mark.opacity, marginBottom: 64 }}>
        <BeeliMark size={140} color={C.cream} accent={C.gold} t={lt} animated />
      </div>
      <div style={{ transform: `translateY(${tag.y}px)`, opacity: tag.opacity, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 76, color: C.cream, lineHeight: 1.08, letterSpacing: "-0.025em" }}>Your language</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 76, color: C.gold, lineHeight: 1.08, letterSpacing: "-0.025em" }}>is one of them.</div>
      </div>
      <div style={{ transform: `translateY(${sub.y}px)`, opacity: sub.opacity, marginTop: 50, textAlign: "center" }}>
        <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 40, color: C.goldHi }}>Free. Audio-first.</div>
        <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 30, color: "rgba(244,236,217,0.6)", marginTop: 8 }}>izonbeeli.app</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  ROOT  ───────────────────────────── */
const B = { four: [0, 4.6], seventy: [4.6, 11], cta: [11, 15] };
export function SkitSeventyVsFour() {
  return (
    <Stage width={W} height={H} duration={15} background={C.ink} persistKey="skit-70v4">
      <Scene start={B.four[0]} end={B.four[1]}>{(s) => <FourScene {...s} />}</Scene>
      <Scene start={B.seventy[0]} end={B.seventy[1]}>{(s) => <SeventyScene {...s} />}</Scene>
      <Scene start={B.cta[0]} end={B.cta[1]} fade={0.4}>{(s) => <CtaScene {...s} />}</Scene>
      <TimeLabel />
    </Stage>
  );
}

export default SkitSeventyVsFour;
