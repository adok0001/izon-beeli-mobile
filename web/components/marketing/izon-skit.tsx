"use client";

// izon-skit.tsx — "The Call" — a 32s vertical (9:16) marketing skit for Beeli's Izon course.
// Story: a diaspora granddaughter can't speak with her grandmother — she learns Izon on
// Beeli — and they finally understand each other. Built on real lesson data + Izon colour symbolism.

import React from "react";
import {
  animate,
  BASE_PALETTE,
  BeeliMark,
  clamp,
  DISPLAY,
  Easing,
  H,
  interpolate,
  MONO,
  mix,
  type Palette,
  pop,
  Scene,
  Stage,
  TEXT,
  TimeLabel,
  W,
} from "@/components/marketing/skit-engine";

// Izon colour symbolism: kwa-kwa (red, royalty/strength), pena-pena (white/light, purity/peace), dirimo (dark)
const C: Palette = BASE_PALETTE;

function Eye({ happy, ink = C.ink }: { happy: boolean; ink?: string }) {
  return happy ? (
    <div style={{ width: 36, height: 18, borderTop: `9px solid ${ink}`, borderRadius: "999px 999px 0 0" }} />
  ) : (
    <div style={{ width: 22, height: 26, borderRadius: 13, background: ink }} />
  );
}

// Flat, friendly avatar built only from circles + rounded rects (no detailed SVG).
function Avatar({
  skin,
  cloth,
  wrap,
  beard,
  mood = "soft",
  scale = 1,
}: {
  skin: string;
  cloth: string;
  wrap?: string;
  beard?: boolean;
  mood?: "soft" | "happy";
  scale?: number;
}) {
  const happy = mood === "happy";
  const ink = C.ink;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${scale})` }}>
      <div style={{ position: "relative", width: 260, height: 250 }}>
        {wrap && (
          <div style={{ position: "absolute", top: -34, left: "50%", transform: "translateX(-50%)", width: 320, height: 150, background: wrap, borderRadius: "160px 160px 46px 46px", zIndex: 1 }} />
        )}
        <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 230, height: 230, borderRadius: "50%", background: skin, zIndex: 2, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: happy ? 92 : 100, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 50 }}>
            <Eye happy={happy} ink={ink} />
            <Eye happy={happy} ink={ink} />
          </div>
          {happy && (
            <>
              <div style={{ position: "absolute", top: 130, left: 44, width: 42, height: 26, borderRadius: 20, background: "rgba(216,97,74,0.42)" }} />
              <div style={{ position: "absolute", top: 130, right: 44, width: 42, height: 26, borderRadius: 20, background: "rgba(216,97,74,0.42)" }} />
            </>
          )}
          <div style={{ position: "absolute", top: happy ? 150 : 160, left: "50%", transform: "translateX(-50%)" }}>
            {happy ? (
              <div style={{ width: 92, height: 50, borderBottom: `10px solid ${ink}`, borderRadius: "0 0 999px 999px" }} />
            ) : (
              <div style={{ width: 56, height: 30, borderBottom: `8px solid ${ink}`, borderRadius: "0 0 999px 999px" }} />
            )}
          </div>
          {beard && (
            <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 150, height: 70, borderRadius: "0 0 90px 90px", background: "rgba(255,255,255,0.55)" }} />
          )}
        </div>
      </div>
      <div style={{ width: 300, height: 230, marginTop: -34, background: cloth, borderRadius: "150px 150px 38px 38px", zIndex: 0 }} />
    </div>
  );
}

// Speech bubble with a small tail. Izon line big, English small.
function Bubble({
  localTime,
  appear,
  side = "left",
  top = 1300,
  izon,
  eng,
  tone = "light",
  confused = false,
}: {
  localTime: number;
  appear: number;
  side?: "left" | "right";
  top?: number;
  izon: string;
  eng?: string;
  tone?: "light" | "dark";
  confused?: boolean;
}) {
  const { opacity, scale, y } = pop(localTime, appear, 0.5, 18);
  if (opacity <= 0.001) return null;
  const dark = tone === "dark";
  const bg = dark ? C.ink : C.paper;
  const fg = dark ? C.cream : C.ink;
  const sub = dark ? "rgba(244,236,217,0.7)" : "rgba(27,24,19,0.6)";
  return (
    <div style={{ position: "absolute", top, [side]: 56, transform: `translateY(${y}px) scale(${scale})`, transformOrigin: side === "left" ? "bottom left" : "bottom right", opacity, maxWidth: 760 }}>
      <div style={{ position: "relative", background: bg, borderRadius: 32, padding: "26px 34px", boxShadow: "0 18px 40px rgba(0,0,0,0.28)" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, lineHeight: 1.05, color: fg, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{izon}</div>
        {eng && <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 32, color: sub, marginTop: 8, whiteSpace: "nowrap" }}>{eng}</div>}
        {confused && <div style={{ position: "absolute", top: -38, right: 26, fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: C.coolHi }}>?</div>}
        <div style={{ position: "absolute", bottom: -16, [side === "left" ? "left" : "right"]: 46, width: 38, height: 38, background: bg, borderRadius: 8, transform: "rotate(45deg)" }} />
      </div>
    </div>
  );
}

function CallChrome({
  name,
  sub,
  accent = C.cream,
  dark = false,
  timer = "00:14",
}: {
  name: string;
  sub?: string;
  accent?: string;
  dark?: boolean;
  timer?: string;
}) {
  return (
    <div style={{ position: "absolute", top: 30, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: C.redHi, boxShadow: `0 0 0 6px ${dark ? "rgba(217,97,74,0.18)" : "rgba(217,97,74,0.22)"}` }} />
        <div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 38, color: accent, lineHeight: 1 }}>{name}</div>
          {sub && <div style={{ fontFamily: TEXT, fontSize: 24, color: accent, opacity: 0.7, marginTop: 4 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 28, color: accent, opacity: 0.75 }}>{timer}</div>
    </div>
  );
}

// audio bars (used in app player). amp drives liveliness.
function Bars({
  t,
  n = 5,
  color = C.gold,
  h = 64,
  w = 12,
  gap = 9,
  amp = 1,
  base = 0.32,
}: {
  t: number;
  n?: number;
  color?: string;
  h?: number;
  w?: number;
  gap?: number;
  amp?: number;
  base?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap, height: h }}>
      {Array.from({ length: n }).map((_, i) => {
        const v = base + amp * 0.5 * (1 + Math.sin(t * 6 + i * 1.1));
        return <div key={i} style={{ width: w, height: `${clamp(v, 0.16, 1) * 100}%`, background: color, borderRadius: w / 2 }} />;
      })}
    </div>
  );
}

/* ─────────────────────────────  SCENE 1 · THE GAP  ───────────────────────────── */
function GapScene({ localTime: lt }: { localTime: number }) {
  const seamShift = 6 * Math.sin(lt * 1.4);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.ink }}>
      {/* top tile — grandmother by the river (warm, but muted/distant) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 956, background: `linear-gradient(180deg, ${C.riverDeep}, ${C.river})`, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,51,59,0.32)" }} />
        <div style={{ position: "absolute", left: "50%", top: 470, transform: "translate(-50%,-50%)" }}>
          <Avatar skin="#8A5A3C" cloth={C.red} wrap={C.gold} mood="soft" scale={1.02} />
        </div>
        <CallChrome name="Kọkọ" sub="Grandma · Yenagoa" accent={C.cream} timer="00:11" />
      </div>
      {/* bottom tile — granddaughter in the diaspora city (cool, distant) */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 956, background: `linear-gradient(180deg, ${C.cool2}, ${C.cool})`, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: 486, transform: "translate(-50%,-50%)" }}>
          <Avatar skin="#9A6A48" cloth={C.coolHi} mood="soft" scale={1.02} />
        </div>
        <div style={{ position: "absolute", bottom: 28, left: 40, fontFamily: TEXT, fontSize: 24, color: "rgba(244,236,217,0.6)" }}>You</div>
      </div>
      {/* the seam — the language gap between them */}
      <div style={{ position: "absolute", top: 956, left: 0, right: 0, height: 8, background: C.ink, transform: `translateY(${seamShift}px)`, boxShadow: "0 0 30px rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", top: 956, left: 0, right: 0, height: 2, transform: `translateY(${seamShift}px)`, background: "repeating-linear-gradient(90deg, transparent 0 28px, rgba(244,236,217,0.25) 28px 40px)" }} />

      <Bubble localTime={lt} appear={0.7} side="left" top={690} tone="light" izon="Baidẹ, tubou!" eng="Good morning, my child!" />
      <Bubble localTime={lt} appear={2.7} side="right" top={1070} tone="dark" izon="…hi, Grandma?" eng="(I can't understand her)" confused />

      {/* center caption */}
      {(() => {
        const p = pop(lt, 4.3, 0.5, 14);
        if (p.opacity <= 0) return null;
        return (
          <div style={{ position: "absolute", top: 956, left: "50%", transform: `translate(-50%, calc(-50% + ${p.y}px)) scale(${p.scale})`, opacity: p.opacity, background: C.paper, borderRadius: 22, padding: "18px 30px", boxShadow: "0 16px 40px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 42, color: C.ink }}>She speaks Ịzọn. </span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 42, color: C.red }}>I don&apos;t.</span>
          </div>
        );
      })()}
    </div>
  );
}

/* ─────────────────────────────  SCENE 2 · THE DECISION  ───────────────────────────── */
function DecisionScene({ localTime: lt }: { localTime: number }) {
  const rise = animate({ from: 240, to: 0, start: 0.5, end: 1.5, ease: Easing.easeOutCubic })(lt);
  const cap = pop(lt, 0.2, 0.5, 16);
  const markP = pop(lt, 1.3, 0.6, 20);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 18%, ${C.cool2}, ${C.cool} 70%)` }}>
      <div style={{ position: "absolute", top: 150, left: "50%", transform: `translate(-50%, ${cap.y}px)`, opacity: cap.opacity, textAlign: "center", width: 900 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 72, color: C.cream, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
          So I started
          <br />
          learning.
        </div>
      </div>
      {/* phone rising with Beeli splash */}
      <div style={{ position: "absolute", left: "50%", bottom: -70, transform: `translate(-50%, ${rise}px)` }}>
        <div style={{ width: 560, height: 1060, borderRadius: 84, background: C.ink2, padding: 22, boxShadow: "0 -30px 80px rgba(0,0,0,0.45)", border: `2px solid ${C.coolHi}` }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 64, background: `linear-gradient(165deg, ${C.cream}, ${C.cream2})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, overflow: "hidden" }}>
            <div style={{ transform: `scale(${markP.scale})`, opacity: markP.opacity }}>
              <BeeliMark size={96} color={C.ink} accent={C.red} />
            </div>
            <div style={{ opacity: clamp((lt - 1.9) / 0.6, 0, 1) * 0.62, fontFamily: TEXT, fontWeight: 600, fontSize: 30, color: C.ink, letterSpacing: "0.02em" }}>Hear Africa speak.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 3 · LEARNING ON BEELI  ───────────────────────────── */
const T3 = [
  { izon: "Baidẹ!", eng: "Good morning!", at: 1.0 },
  { izon: "Tụbara?", eng: "How are you?", at: 3.2 },
  { izon: "Doo!", eng: "Thank you!", at: 5.4 },
];
function LearnScene({ localTime: lt }: { localTime: number }) {
  const active = T3.reduce((acc, l, i) => (lt >= l.at ? i : acc), -1);
  const playProg = clamp((lt - 0.8) / 6.4, 0, 1);
  const done = lt > 7.4;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.paper }}>
      {/* status + header */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "46px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BeeliMark size={48} color={C.ink} accent={C.red} />
          <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 28, color: C.river, background: "rgba(21,94,99,0.1)", padding: "8px 20px", borderRadius: 999 }}>Ịzọn · First Words</div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 72, color: C.ink, marginTop: 40, letterSpacing: "-0.02em" }}>
          Greetings &amp;
          <br />
          Salutations
        </div>
        <div style={{ fontFamily: TEXT, fontSize: 30, color: "rgba(27,24,19,0.55)", marginTop: 14 }}>Lesson 1 — the first words every Izon speaker knows</div>
      </div>

      {/* audio player card */}
      <div style={{ position: "absolute", top: 470, left: 56, right: 56, background: `linear-gradient(155deg, ${C.river}, ${C.riverDeep})`, borderRadius: 40, padding: "40px 44px", boxShadow: "0 24px 60px rgba(14,62,68,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 110, height: 110, borderRadius: 999, background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ width: 0, height: 0, borderLeft: `40px solid ${C.ink}`, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", marginLeft: 10 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Bars t={lt} n={9} color={C.goldHi} h={70} w={10} gap={8} amp={1} base={0.28} />
          </div>
        </div>
        {/* progress + controls */}
        <div style={{ marginTop: 30, height: 8, borderRadius: 4, background: "rgba(244,236,217,0.2)", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${playProg * 100}%`, background: C.gold, borderRadius: 4 }} />
          <div style={{ position: "absolute", left: `${playProg * 100}%`, top: "50%", width: 20, height: 20, marginLeft: -10, marginTop: -10, borderRadius: 10, background: C.cream }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, fontFamily: MONO, fontSize: 26, color: C.cream }}>
          <span style={{ opacity: 0.85 }}>0:0{Math.min(9, Math.floor(playProg * 9))} / 0:09</span>
          <div style={{ display: "flex", gap: 14 }}>
            {["−15s", "1.0×", "+15s"].map((x) => (
              <span key={x} style={{ background: "rgba(244,236,217,0.14)", padding: "6px 16px", borderRadius: 999, fontSize: 24 }}>
                {x}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* segment-synced transcript */}
      <div style={{ position: "absolute", top: 880, left: 56, right: 56, display: "flex", flexDirection: "column", gap: 18 }}>
        {T3.map((l, i) => {
          const isActive = i === active;
          const shown = lt >= l.at - 0.1;
          const p = pop(lt, l.at - 0.1, 0.45, 18);
          return (
            <div key={i} style={{ opacity: shown ? p.opacity : 0.28, transform: `translateY(${shown ? p.y : 0}px)`, background: isActive ? C.cream : "transparent", border: `2px solid ${isActive ? C.gold : "rgba(27,24,19,0.12)"}`, borderRadius: 26, padding: "24px 30px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, transition: "background 200ms" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 58, color: isActive ? C.red : C.ink, borderBottom: isActive ? `4px dotted ${C.red}` : "none", paddingBottom: 2 }}>{l.izon}</span>
              </div>
              <span style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 34, color: "rgba(27,24,19,0.6)" }}>{l.eng}</span>
            </div>
          );
        })}
      </div>

      {/* tap-any-word tooltip */}
      {lt > 1.4 && lt < 3.0 && (() => {
        const p = pop(lt, 1.4, 0.4, 12);
        return (
          <div style={{ position: "absolute", top: 792, left: 250, opacity: p.opacity, transform: `translateY(${p.y}px) scale(${p.scale})` }}>
            <div style={{ background: C.ink, color: C.cream, fontFamily: TEXT, fontWeight: 600, fontSize: 26, padding: "12px 20px", borderRadius: 16, whiteSpace: "nowrap" }}>tap any word ✦</div>
            <div style={{ width: 18, height: 18, background: C.ink, transform: "rotate(45deg)", marginLeft: 40, marginTop: -9 }} />
          </div>
        );
      })()}

      {/* bottom caption */}
      <div style={{ position: "absolute", bottom: 70, left: 56, right: 56, textAlign: "center" }}>
        {done ? (
          (() => {
            const p = pop(lt, 7.5, 0.5, 14);
            return (
              <div style={{ opacity: p.opacity, transform: `scale(${p.scale})` }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, color: C.river }}>✓ I can hear it now.</span>
              </div>
            );
          })()
        ) : (
          <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 32, color: "rgba(27,24,19,0.55)" }}>
            Audio-first — built for languages you{" "}
            <em style={{ fontStyle: "normal", color: C.red, fontWeight: 700 }}>hear</em> before you read.
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 4 · ROOTS (the river)  ───────────────────────────── */
function RiverScene({ localTime: lt, duration }: { localTime: number; duration: number }) {
  const zoom = 1 + 0.06 * (lt / duration);
  const canoeX = interpolate([0, 1], [-200, 1280], Easing.easeInOutSine)(clamp(lt / duration, 0, 1));
  const cap = pop(lt, 0.6, 0.7, 22);
  return (
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${C.river} 0%, ${C.riverDeep} 100%)`, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "center" }}>
        {/* water bands */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ position: "absolute", left: -40, right: -40, top: 1180 + i * 150, height: 90, borderRadius: "50%", background: i % 2 ? "rgba(244,236,217,0.06)" : "rgba(44,142,132,0.22)", transform: `translateX(${Math.sin(lt * 1.2 + i) * 26}px)` }} />
        ))}
        {/* canoe with a paddler (simple shapes) */}
        <div style={{ position: "absolute", top: 1180, left: canoeX }}>
          <div style={{ position: "relative", transform: `translateY(${Math.sin(lt * 2) * 8}px) rotate(${Math.sin(lt * 1.3) * 1.5}deg)` }}>
            <div style={{ width: 64, height: 90, borderRadius: "50%", background: C.ink, position: "absolute", left: 58, top: -64 }} />
            <div style={{ width: 8, height: 120, background: C.cream2, position: "absolute", left: 120, top: -110, borderRadius: 4, transform: `rotate(${20 + Math.sin(lt * 3) * 14}deg)`, transformOrigin: "bottom" }} />
            <div style={{ width: 260, height: 70, background: C.red, borderRadius: "0 0 140px 140px / 0 0 70px 70px" }} />
          </div>
        </div>
      </div>
      {/* proverb */}
      <div style={{ position: "absolute", top: 360, left: 70, right: 70, opacity: cap.opacity, transform: `translateY(${cap.y}px)` }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 84, color: C.cream, lineHeight: 1.04, letterSpacing: "-0.02em" }}>
          Toru angọ
          <br />
          kụlụ bogha.
        </div>
        <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 40, color: C.goldHi, marginTop: 28, lineHeight: 1.25 }}>
          The river never forgets
          <br />
          its source.
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 5 · THE PAYOFF  ───────────────────────────── */
function PayoffScene({ localTime: lt }: { localTime: number }) {
  // warmth grows: cool bottom tile floods to gold/red as she's understood
  const warm = clamp((lt - 1.6) / 1.6, 0, 1);
  const glow = clamp((lt - 2.4) / 1.2, 0, 1);
  const seamFade = 1 - clamp((lt - 2.2) / 1.4, 0, 1);
  const grandmaHappy = lt > 2.2;
  const bottomBg = `linear-gradient(180deg, ${mix(C.cool2, C.redHi, warm)}, ${mix(C.cool, C.red, warm)})`;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.ink }}>
      {/* top — grandmother, lighting up */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 956, background: `linear-gradient(180deg, ${C.riverDeep}, ${C.river})`, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: 470, width: 720, height: 720, transform: "translate(-50%,-50%)", borderRadius: "50%", background: `radial-gradient(circle, rgba(242,196,90,${0.55 * glow}) 0%, rgba(242,196,90,0) 62%)` }} />
        <div style={{ position: "absolute", left: "50%", top: 470, transform: "translate(-50%,-50%)" }}>
          <Avatar skin="#8A5A3C" cloth={C.red} wrap={C.gold} mood={grandmaHappy ? "happy" : "soft"} scale={1.04} />
        </div>
        {/* joy sparks */}
        {glow > 0 &&
          [0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2 + lt;
            return <div key={i} style={{ position: "absolute", left: 540 + Math.cos(a) * 330, top: 470 + Math.sin(a) * 300, width: 18, height: 18, borderRadius: 9, background: C.goldHi, opacity: glow * (0.5 + 0.5 * Math.sin(lt * 4 + i)) }} />;
          })}
        <CallChrome name="Kọkọ" sub="Grandma · Yenagoa" accent={C.cream} timer="00:48" />
      </div>
      {/* bottom — granddaughter, warming */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 956, background: bottomBg, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: 486, transform: "translate(-50%,-50%)" }}>
          <Avatar skin="#9A6A48" cloth={mix(C.coolHi, C.gold, warm)} mood={lt > 0.5 ? "happy" : "soft"} scale={1.04} />
        </div>
      </div>
      {/* seam dissolving */}
      <div style={{ position: "absolute", top: 952, left: 0, right: 0, height: 14, background: `linear-gradient(90deg, transparent, ${C.goldHi}, transparent)`, opacity: (1 - seamFade) * 0.9 }} />
      <div style={{ position: "absolute", top: 956, left: 0, right: 0, height: 8, background: C.ink, opacity: seamFade }} />

      <Bubble localTime={lt} appear={0.5} side="right" top={1070} tone="dark" izon="Baidẹ, Kọkọ! Tụbara?" eng="Good morning, Grandma! How are you?" />
      {lt > 2.4 && <Bubble localTime={lt} appear={2.6} side="left" top={690} tone="light" izon="Doo! Emi!" eng="Thank you! I'm well!" />}
    </div>
  );
}

/* ─────────────────────────────  SCENE 6 · CTA  ───────────────────────────── */
function CtaScene({ localTime: lt }: { localTime: number }) {
  const mark = pop(lt, 0.2, 0.6, 20);
  const tag = pop(lt, 0.9, 0.6, 18);
  const sub = pop(lt, 1.5, 0.6, 14);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(130% 90% at 50% 30%, ${C.ink2}, ${C.ink} 75%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {/* faint colour-symbolism band */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
        <div style={{ flex: 1, background: C.red }} />
        <div style={{ flex: 1, background: C.cream }} />
        <div style={{ flex: 1, background: C.river }} />
      </div>
      <div style={{ transform: `translateY(${mark.y}px) scale(${mark.scale})`, opacity: mark.opacity, marginBottom: 70 }}>
        <BeeliMark size={150} color={C.cream} accent={C.gold} t={lt} animated />
      </div>
      <div style={{ transform: `translateY(${tag.y}px)`, opacity: tag.opacity, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 90, color: C.cream, lineHeight: 1.06, letterSpacing: "-0.025em", whiteSpace: "nowrap" }}>Your language,</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 90, color: C.gold, lineHeight: 1.06, letterSpacing: "-0.025em", whiteSpace: "nowrap" }}>your roots.</div>
      </div>
      <div style={{ transform: `translateY(${sub.y}px)`, opacity: sub.opacity, marginTop: 56, textAlign: "center" }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 40, color: C.cream, opacity: 0.92 }}>Learn Ịzọn — and 70+ African languages.</div>
        <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 40, color: C.gold, marginTop: 10 }}>Free. Audio-first.</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  ROOT  ───────────────────────────── */
// Beat timing (seconds)
const B = { gap: [0, 6.4], dec: [6.4, 10.4], learn: [10.4, 19.4], river: [19.4, 23.6], pay: [23.6, 29.6], cta: [29.6, 32] };

export function IzonSkit() {
  return (
    <Stage width={W} height={H} duration={32} background={C.ink} persistKey="izon-skit">
      <Scene start={B.gap[0]} end={B.gap[1]}>{(s) => <GapScene {...s} />}</Scene>
      <Scene start={B.dec[0]} end={B.dec[1]}>{(s) => <DecisionScene {...s} />}</Scene>
      <Scene start={B.learn[0]} end={B.learn[1]}>{(s) => <LearnScene {...s} />}</Scene>
      <Scene start={B.river[0]} end={B.river[1]}>{(s) => <RiverScene {...s} />}</Scene>
      <Scene start={B.pay[0]} end={B.pay[1]}>{(s) => <PayoffScene {...s} />}</Scene>
      <Scene start={B.cta[0]} end={B.cta[1]} fade={0.4}>{(s) => <CtaScene {...s} />}</Scene>
      {/* timestamp label for commenting */}
      <TimeLabel />
    </Stage>
  );
}

export default IzonSkit;
