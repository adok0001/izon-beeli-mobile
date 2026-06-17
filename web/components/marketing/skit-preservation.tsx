"use client";

// skit-preservation.tsx — "Going Silent" — a 30s vertical (9:16) mission skit.
// Endangered language names flicker out; Beeli teaches ones you can't learn elsewhere; a
// 2,000-year-old script (Ge'ez Fidel) lights up; a contributor flywheel keeps it alive.

import React from "react";
import {
  BASE_PALETTE,
  BeeliMark,
  clamp,
  DISPLAY,
  Easing,
  H,
  interpolate,
  type Palette,
  pop,
  Scene,
  SERIF,
  Stage,
  TEXT,
  TimeLabel,
  W,
} from "@/components/marketing/skit-engine";

const C: Palette = {
  ...BASE_PALETTE,
  ink: "#0E0C09",
  ink2: "#1B1813",
  ember: "#C77A1E",
};

/* ─────────────────────────────  SCENE 1 · GOING SILENT  ───────────────────────────── */
// A field of language names; one by one they fade to nothing.
const FIELD: Array<[string, number, number]> = [
  ["Margi", 120, 220], ["Ogoni", 760, 300], ["Nembe", 300, 470], ["Coptic", 720, 560],
  ["Tamazight", 140, 690], ["Urhobo", 600, 760], ["Itsekiri", 200, 940], ["Khana", 700, 1010],
  ["Defaka", 120, 1180], ["Eleme", 640, 1230], ["Nkoroo", 280, 1380], ["Kukele", 720, 1470],
  ["Obolo", 160, 1560], ["Engenni", 600, 1620],
];
function SilentScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 2.0, 0.7, 16);
  const numP = pop(lt, 3.0, 0.7, 18);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 40%, ${C.ink2}, ${C.ink} 78%)`, overflow: "hidden" }}>
      {/* faint field of endangered language names, flickering out */}
      {FIELD.map(([n, x, y], i) => {
        const offTime = 0.4 + i * 0.28;
        const flick = lt > offTime ? clamp(1 - (lt - offTime) / 0.5, 0, 1) : clamp((lt - i * 0.05) / 0.4, 0, 1);
        const jitter = lt > offTime - 0.2 && lt < offTime ? (Math.random() > 0.5 ? 0.4 : 1) : 1;
        return (
          <div key={n} style={{ position: "absolute", left: x, top: y, fontFamily: DISPLAY, fontWeight: 600, fontSize: 44, color: C.cream, opacity: flick * 0.42 * jitter, whiteSpace: "nowrap" }}>
            {n}
          </div>
        );
      })}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(58% 30% at 50% 46%, rgba(14,12,9,0.86), rgba(14,12,9,0) 72%)" }} />
      {/* central line */}
      <div style={{ position: "absolute", top: 700, left: 0, right: 0, textAlign: "center", opacity: cap.opacity, transform: `translateY(${cap.y}px)` }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 44, color: "rgba(244,236,217,0.78)" }}>A language goes silent</div>
        <div style={{ opacity: numP.opacity, transform: `translateY(${numP.y}px)`, fontFamily: DISPLAY, fontWeight: 800, fontSize: 130, color: C.goldHi, lineHeight: 1.0, marginTop: 14, letterSpacing: "-0.02em" }}>
          every
          <br />
          two weeks.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 2 · NOWHERE ELSE  ───────────────────────────── */
const ENDANGERED = ["Ogoni · Khana", "Tamazight", "Nembe", "Coptic", "Margi", "Urhobo"];
function NowhereScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.3, 0.6, 16);
  const turn = pop(lt, 4.0, 0.6, 16);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 30%, ${C.riverDeep}, ${C.ink} 80%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, textAlign: "center", marginBottom: 50 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 62, color: C.cream, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Some you can&apos;t learn
          <br />
          anywhere else.
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 22, justifyContent: "center", maxWidth: 880 }}>
        {ENDANGERED.map((n, i) => {
          const p = pop(lt, 1.0 + i * 0.28, 0.5, 16);
          const glow = clamp((lt - (1.0 + i * 0.28)) / 0.8, 0, 1);
          return (
            <div key={n} style={{ opacity: p.opacity, transform: `translateY(${p.y}px) scale(${p.scale})`, fontFamily: DISPLAY, fontWeight: 700, fontSize: 48, color: C.goldHi, border: `2px solid rgba(242,196,90,${0.3 + 0.4 * glow})`, borderRadius: 999, padding: "16px 38px", boxShadow: `0 0 ${40 * glow}px rgba(242,196,90,${0.22 * glow})`, whiteSpace: "nowrap" }}>
              {n}
            </div>
          );
        })}
      </div>
      <div style={{ opacity: turn.opacity, transform: `translateY(${turn.y}px)`, marginTop: 64, display: "flex", alignItems: "center", gap: 22 }}>
        <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 42, color: "rgba(244,236,217,0.7)" }}>Until now, on</span>
        <BeeliMark size={52} color={C.cream} accent={C.gold} />
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 3 · THE SCRIPT (GE'EZ)  ───────────────────────────── */
// Real Fidel base characters (Ethiopic block).
const FIDEL = ["ሀ", "ለ", "ሐ", "መ", "ረ", "ሰ", "ሸ", "ቀ", "በ", "ተ", "ቸ", "ነ", "አ", "ከ", "ወ", "ዘ", "የ", "ደ", "ገ", "ጠ", "ጸ", "ፈ"];
function ScriptScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.3, 0.6, 16);
  const heroP = pop(lt, 3.0, 0.8, 24);
  const nowP = pop(lt, 4.6, 0.6, 14);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 30%, ${C.ink2}, ${C.ink} 82%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 40, color: "rgba(244,236,217,0.72)" }}>A script</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: C.goldHi, lineHeight: 1, letterSpacing: "-0.02em" }}>2,000 years old.</div>
      </div>
      {/* Fidel grid lighting up */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", justifyContent: "center", maxWidth: 800, marginBottom: 44 }}>
        {FIDEL.map((ch, i) => {
          const p = pop(lt, 0.8 + i * 0.06, 0.4, 10);
          const glow = clamp((lt - (0.8 + i * 0.06)) / 0.6, 0, 1);
          return (
            <span key={i} style={{ opacity: p.opacity, transform: `translateY(${p.y}px)`, fontFamily: SERIF, fontWeight: 500, fontSize: 56, color: i % 4 === 0 ? C.goldHi : "rgba(244,236,217,0.55)", textShadow: i % 4 === 0 ? `0 0 ${20 * glow}px rgba(242,196,90,0.4)` : "none" }}>
              {ch}
            </span>
          );
        })}
      </div>
      {/* hero word — ትዝታ Tizita */}
      <div style={{ opacity: heroP.opacity, transform: `translateY(${heroP.y}px) scale(${heroP.scale})`, textAlign: "center" }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -40, borderRadius: "50%", background: `radial-gradient(circle, rgba(242,196,90,${0.4 * clamp((lt - 3) / 1.2, 0, 1)}), rgba(242,196,90,0) 66%)` }} />
          <div style={{ position: "relative", fontFamily: SERIF, fontWeight: 600, fontSize: 148, color: C.cream, lineHeight: 1 }}>ትዝታ</div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color: C.goldHi, marginTop: 16 }}>Tizita</div>
        <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 36, color: "rgba(244,236,217,0.65)", marginTop: 6 }}>memory, and the longing for it</div>
      </div>
      <div style={{ opacity: nowP.opacity, transform: `translateY(${nowP.y}px)`, marginTop: 44, fontFamily: TEXT, fontWeight: 700, fontSize: 44, color: C.cream }}>Now on your phone.</div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 4 · THE FLYWHEEL  ───────────────────────────── */
const CONTRIB = ["Tariku added 12 words", "Selam recorded audio", "Dawit added a proverb", "Hanna verified 30 entries"];
function FlywheelScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.3, 0.6, 16);
  const count = Math.round(interpolate([0.6, 4.5], [0, 12480], Easing.easeOutCubic)(lt));
  const countStr = String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const prov = pop(lt, 3.6, 0.6, 16);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 26%, ${C.riverDeep}, ${C.ink} 82%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color: C.cream, lineHeight: 1.12, letterSpacing: "-0.01em" }}>
          It stays alive because
          <br />
          its speakers keep adding to it.
        </div>
      </div>
      {/* climbing counter */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150, color: C.goldHi, lineHeight: 1, letterSpacing: "-0.02em" }}>{countStr}</div>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 34, color: "rgba(244,236,217,0.62)", marginTop: 4 }}>words added by native speakers</div>
      </div>
      {/* contributor chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 760 }}>
        {CONTRIB.map((c, i) => {
          const p = pop(lt, 1.0 + i * 0.35, 0.45, 14);
          return (
            <div key={c} style={{ opacity: p.opacity, transform: `translateX(${(1 - Easing.easeOutCubic(clamp((lt - (1.0 + i * 0.35)) / 0.45, 0, 1))) * 30}px)`, display: "flex", alignItems: "center", gap: 16, background: "rgba(244,236,217,0.07)", border: "1px solid rgba(244,236,217,0.12)", borderRadius: 18, padding: "16px 26px" }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, background: C.riverHi }} />
              <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 32, color: C.cream }}>{c}</span>
            </div>
          );
        })}
      </div>
      <div style={{ opacity: prov.opacity, transform: `translateY(${prov.y}px)`, marginTop: 44, textAlign: "center" }}>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 40, color: C.cream, lineHeight: 1.3 }}>ዕቃ ቢጠፋ ይገኛል፣ ጊዜ ቢጠፋ አይገኝም</div>
        <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 30, color: C.goldHi, marginTop: 10 }}>A lost thing can be found. Lost time cannot.</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 5 · CTA  ───────────────────────────── */
function CtaScene({ localTime: lt }: { localTime: number }) {
  const head = pop(lt, 0.2, 0.7, 18);
  const mark = pop(lt, 1.4, 0.6, 18);
  const sub = pop(lt, 2.0, 0.6, 14);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(130% 90% at 50% 34%, ${C.ink2}, ${C.ink} 78%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
        <div style={{ flex: 1, background: C.red }} />
        <div style={{ flex: 1, background: C.gold }} />
        <div style={{ flex: 1, background: C.river }} />
      </div>
      <div style={{ opacity: head.opacity, transform: `translateY(${head.y}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 62, color: C.cream, lineHeight: 1.14, letterSpacing: "-0.02em" }}>
          Some languages live only in
          <br />
          the people who still speak them.
        </div>
      </div>
      <div style={{ transform: `translateY(${mark.y}px) scale(${mark.scale})`, opacity: mark.opacity, margin: "70px 0 40px" }}>
        <BeeliMark size={130} color={C.cream} accent={C.gold} t={lt} animated />
      </div>
      <div style={{ opacity: sub.opacity, transform: `translateY(${sub.y}px)`, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 58, color: C.goldHi, letterSpacing: "-0.01em" }}>Help keep them spoken.</div>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 34, color: "rgba(244,236,217,0.6)", marginTop: 14 }}>Free. Audio-first. · izonbeeli.app</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  ROOT  ───────────────────────────── */
const B = { silent: [0, 5.6], nowhere: [5.6, 11.4], script: [11.4, 18.4], fly: [18.4, 24.4], cta: [24.4, 30] };
export function SkitPreservation() {
  return (
    <Stage width={W} height={H} duration={30} background={C.ink} persistKey="skit-preservation">
      <Scene start={B.silent[0]} end={B.silent[1]}>{(s) => <SilentScene {...s} />}</Scene>
      <Scene start={B.nowhere[0]} end={B.nowhere[1]}>{(s) => <NowhereScene {...s} />}</Scene>
      <Scene start={B.script[0]} end={B.script[1]}>{(s) => <ScriptScene {...s} />}</Scene>
      <Scene start={B.fly[0]} end={B.fly[1]}>{(s) => <FlywheelScene {...s} />}</Scene>
      <Scene start={B.cta[0]} end={B.cta[1]} fade={0.4}>{(s) => <CtaScene {...s} />}</Scene>
      <TimeLabel />
    </Stage>
  );
}

export default SkitPreservation;
