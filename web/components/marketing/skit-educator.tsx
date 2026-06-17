"use client";

// skit-educator.tsx — "Top of the Class" — a 30s vertical (9:16) skit for the educator audience.
// A heritage-language teacher spins up a free Beeli classroom; students join, battle in quizzes,
// and the kid who never practiced ends up top of the leaderboard.

import React from "react";
import {
  BASE_PALETTE,
  BeeliMark,
  clamp,
  DISPLAY,
  Easing,
  H,
  interpolate,
  MONO,
  type Palette,
  pop,
  Scene,
  Stage,
  TEXT,
  TimeLabel,
  W,
} from "@/components/marketing/skit-engine";

const C: Palette = {
  ...BASE_PALETTE,
  green: "#3E9B6B",
  greenHi: "#5CB985",
};

function Phone({ children, w = 600, accent = C.coolHi }: { children: React.ReactNode; w?: number; accent?: string }) {
  return (
    <div style={{ width: w, height: w * 1.9, borderRadius: 76, background: C.ink2, padding: 18, border: `2px solid ${accent}`, boxShadow: "0 30px 90px rgba(0,0,0,0.5)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", background: C.paper, position: "relative" }}>{children}</div>
    </div>
  );
}

function Avatar({ name, color, size = 76, ring }: { name: string; color: string; size?: number; ring?: string | null }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: ring ? `0 0 0 5px ${ring}` : "none" }}>
      <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size * 0.42, color: "#fff" }}>{name[0]}</span>
    </div>
  );
}

/* ─────────────────────────────  SCENE 1 · THE PROBLEM  ───────────────────────────── */
const ROSTER = [
  { n: "Amani", c: C.river }, { n: "Zawadi", c: C.red }, { n: "Juma", c: C.gold },
  { n: "Neema", c: C.greenHi }, { n: "Baraka", c: C.riverHi }, { n: "Fadhila", c: C.redHi },
];
function ProblemScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.3, 0.6, 18);
  const line = pop(lt, 2.4, 0.6, 18);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 30%, ${C.cool2}, ${C.cool} 74%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, fontFamily: TEXT, fontWeight: 600, fontSize: 38, color: "rgba(244,236,217,0.72)", marginBottom: 40, textAlign: "center" }}>
        Every heritage-language teacher
        <br />
        knows the problem.
      </div>
      {/* homework roster, mostly undone */}
      <div style={{ width: 760, background: "rgba(27,24,19,0.34)", borderRadius: 32, padding: "34px 40px", border: "1px solid rgba(244,236,217,0.12)" }}>
        <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 30, color: C.cream, marginBottom: 24, letterSpacing: "0.04em" }}>SWAHILI · HOMEWORK</div>
        {ROSTER.map((s, i) => {
          const done = i === 0;
          const p = pop(lt, 0.7 + i * 0.12, 0.4, 10);
          return (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 0", borderTop: i ? "1px solid rgba(244,236,217,0.08)" : "none", opacity: p.opacity, transform: `translateY(${p.y}px)` }}>
              <Avatar name={s.n} color={s.c} size={60} />
              <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 34, color: C.cream, flex: 1 }}>{s.n}</div>
              <div style={{ width: 46, height: 46, borderRadius: 23, border: `3px solid ${done ? C.greenHi : "rgba(244,236,217,0.3)"}`, background: done ? C.greenHi : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {done && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5 9-10" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ opacity: line.opacity, transform: `translateY(${line.y}px)`, marginTop: 50, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color: C.cream, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          “They just won&apos;t
          <br />
          practice at home.”
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 2 · THE FREE CLASSROOM  ───────────────────────────── */
function SetupScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.2, 0.5, 14);
  const joined = Math.min(ROSTER.length, Math.floor(clamp((lt - 3.2) / 2.6, 0, 1) * ROSTER.length + 0.001));
  const codeShow = lt > 1.4;
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 22%, ${C.riverDeep}, ${C.ink} 80%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, fontFamily: TEXT, fontWeight: 600, fontSize: 38, color: C.goldHi, marginBottom: 28 }}>So she made a free classroom.</div>
      <Phone>
        <div style={{ position: "absolute", inset: 0, background: C.cream }} />
        {/* header */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "44px 44px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <BeeliMark size={40} color={C.ink} accent={C.red} />
            <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 24, color: C.green, background: "rgba(62,155,107,0.14)", padding: "8px 20px", borderRadius: 999 }}>Educator</div>
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 62, color: C.ink, marginTop: 36, letterSpacing: "-0.02em", lineHeight: 1 }}>
            Mrs. Okafor&apos;s
            <br />
            Swahili Class
          </div>
          {codeShow && (() => {
            const p = pop(lt, 1.4, 0.5, 14);
            return (
              <div style={{ opacity: p.opacity, transform: `translateY(${p.y}px)`, marginTop: 26, display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 28, color: "rgba(27,24,19,0.5)" }}>Invite code</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 36, color: C.ink, background: C.cream2, padding: "8px 24px", borderRadius: 14, letterSpacing: "0.1em" }}>SWA-7K2</span>
              </div>
            );
          })()}
        </div>
        {/* students joining */}
        <div style={{ position: "absolute", top: 540, left: 44, right: 44 }}>
          <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 28, color: "rgba(27,24,19,0.5)", marginBottom: 20 }}>{joined} students joined</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
            {ROSTER.map((s, i) => {
              const shown = i < joined;
              const p = pop(lt, 3.2 + i * 0.4, 0.45, 16);
              return (
                <div key={s.n} style={{ opacity: shown ? p.opacity : 0, transform: `translateY(${shown ? p.y : 0}px) scale(${shown ? p.scale : 0.8})`, display: "flex", alignItems: "center", gap: 14, background: C.paper, borderRadius: 999, padding: "12px 24px 12px 12px", boxShadow: "0 6px 18px rgba(27,24,19,0.08)" }}>
                  <Avatar name={s.n} color={s.c} size={56} />
                  <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 32, color: C.ink }}>{s.n}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* footer: 2 minutes */}
        <div style={{ position: "absolute", bottom: 70, left: 44, right: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, opacity: clamp((lt - 5) / 0.6, 0, 1) }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: C.green }} />
          <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 34, color: C.ink }}>Set up in 2 minutes.</span>
        </div>
      </Phone>
    </div>
  );
}

/* ─────────────────────────────  SCENE 3 · QUIZ BATTLE  ───────────────────────────── */
const OPTS = ["Good morning", "Good night", "Thank you", "Welcome"];
function BattleScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.2, 0.5, 14);
  // scores climb; Juma (gold) overtakes
  const sZ = Math.round(interpolate([0.5, 6.5], [40, 80], Easing.easeOutCubic)(lt));
  const sJ = Math.round(interpolate([0.5, 6.5], [30, 110], Easing.easeOutCubic)(lt));
  const picked = lt > 3.6;
  const correct = 0;
  const ringT = clamp((lt % 3) / 3, 0, 1);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 26%, ${C.cool}, ${C.ink} 78%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, fontFamily: TEXT, fontWeight: 600, fontSize: 38, color: C.cream, marginBottom: 26 }}>
        Then they found <span style={{ color: C.goldHi, fontWeight: 700 }}>quiz battles.</span>
      </div>
      <Phone>
        <div style={{ position: "absolute", inset: 0, background: C.cream }} />
        {/* battle header: two players */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 230, background: C.ink2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 50px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Avatar name="Zawadi" color={C.red} size={96} />
            <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 28, color: C.cream }}>Zawadi</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.cream }}>{sZ}</span>
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, color: C.gold }}>VS</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Avatar name="Juma" color={C.gold} size={96} ring={lt > 4.5 ? C.goldHi : null} />
            <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 28, color: C.cream }}>Juma</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 52, color: C.goldHi }}>{sJ}</span>
          </div>
        </div>
        {/* timer ring */}
        <div style={{ position: "absolute", top: 286, left: "50%", transform: "translateX(-50%)" }}>
          <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="55" cy="55" r="45" stroke="rgba(27,24,19,0.1)" strokeWidth="10" fill="none" />
            <circle cx="55" cy="55" r="45" stroke={C.gold} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={ringT * 2 * Math.PI * 45} />
          </svg>
        </div>
        {/* question */}
        <div style={{ position: "absolute", top: 426, left: 50, right: 50, textAlign: "center" }}>
          <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 28, color: "rgba(27,24,19,0.5)" }}>What does this mean?</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 74, color: C.ink, marginTop: 10, letterSpacing: "-0.02em", lineHeight: 1.02 }}>
            Habari za
            <br />
            asubuhi
          </div>
        </div>
        {/* options */}
        <div style={{ position: "absolute", top: 716, left: 50, right: 50, display: "flex", flexDirection: "column", gap: 16 }}>
          {OPTS.map((o, i) => {
            const isCorrect = i === correct;
            const state = picked ? (isCorrect ? "right" : "dim") : "idle";
            const bg = state === "right" ? C.green : C.paper;
            const fg = state === "right" ? "#fff" : C.ink;
            const p = pop(lt, 1.0 + i * 0.18, 0.4, 14);
            return (
              <div key={o} style={{ opacity: (state === "dim" ? 0.4 : 1) * p.opacity, transform: `translateY(${p.y}px) scale(${state === "right" ? 1.03 : 1})`, background: bg, border: `2px solid ${state === "right" ? C.green : "rgba(27,24,19,0.12)"}`, borderRadius: 24, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: state === "right" ? "0 14px 36px rgba(62,155,107,0.35)" : "none", transition: "background 150ms" }}>
                <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 36, color: fg }}>{o}</span>
                {state === "right" && (
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5 9-10" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </Phone>
    </div>
  );
}

/* ─────────────────────────────  SCENE 4 · TOP OF THE CLASS  ───────────────────────────── */
function PayoffScene({ localTime: lt }: { localTime: number }) {
  const cap = pop(lt, 0.3, 0.6, 16);
  const board = [
    { n: "Juma", c: C.gold, xp: 1180, hi: true },
    { n: "Zawadi", c: C.red, xp: 940, hi: false },
    { n: "Neema", c: C.greenHi, xp: 880, hi: false },
    { n: "Amani", c: C.river, xp: 760, hi: false },
  ];
  const prov = pop(lt, 2.8, 0.6, 16);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 24%, ${C.riverDeep}, ${C.ink} 80%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 70px" }}>
      <div style={{ opacity: cap.opacity, transform: `translateY(${cap.y}px)`, textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 36, color: "rgba(244,236,217,0.7)" }}>The kid who never practiced?</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 72, color: C.goldHi, marginTop: 8, letterSpacing: "-0.02em" }}>Top of the class.</div>
      </div>
      {/* leaderboard */}
      <div style={{ width: 820 }}>
        {board.map((s, i) => {
          const p = pop(lt, 0.9 + i * 0.2, 0.45, 16);
          const w = (s.xp / 1180) * 100;
          return (
            <div key={s.n} style={{ opacity: p.opacity, transform: `translateY(${p.y}px)`, display: "flex", alignItems: "center", gap: 22, background: s.hi ? "rgba(227,165,44,0.16)" : "rgba(244,236,217,0.06)", border: `2px solid ${s.hi ? C.gold : "rgba(244,236,217,0.1)"}`, borderRadius: 26, padding: "22px 30px", marginBottom: 16 }}>
              <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, color: s.hi ? C.goldHi : "rgba(244,236,217,0.5)", width: 56 }}>{i + 1}</span>
              <Avatar name={s.n} color={s.c} size={72} ring={s.hi ? C.goldHi : null} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 38, color: C.cream }}>{s.n}</div>
                <div style={{ height: 10, borderRadius: 5, background: "rgba(244,236,217,0.12)", marginTop: 8 }}>
                  <div style={{ width: `${w}%`, height: "100%", borderRadius: 5, background: s.hi ? C.gold : C.riverHi }} />
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, color: s.hi ? C.goldHi : "rgba(244,236,217,0.6)" }}>{s.xp}</span>
            </div>
          );
        })}
      </div>
      <div style={{ opacity: prov.opacity, transform: `translateY(${prov.y}px)`, marginTop: 36, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: C.cream }}>Haba na haba hujaza kibaba.</div>
        <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 30, color: C.goldHi, marginTop: 8 }}>Little by little fills the measure.</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 5 · CTA  ───────────────────────────── */
function CtaScene({ localTime: lt }: { localTime: number }) {
  const mark = pop(lt, 0.2, 0.6, 20);
  const tag = pop(lt, 0.8, 0.6, 16);
  const sub = pop(lt, 1.4, 0.6, 14);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(130% 90% at 50% 32%, ${C.ink2}, ${C.ink} 76%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
        <div style={{ flex: 1, background: C.river }} />
        <div style={{ flex: 1, background: C.gold }} />
        <div style={{ flex: 1, background: C.green }} />
      </div>
      <div style={{ transform: `translateY(${mark.y}px) scale(${mark.scale})`, opacity: mark.opacity, marginBottom: 60 }}>
        <BeeliMark size={140} color={C.cream} accent={C.gold} t={lt} animated />
      </div>
      <div style={{ transform: `translateY(${tag.y}px)`, opacity: tag.opacity, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 66, color: C.cream, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
          A free classroom,
          <br />
          built with native speakers.
        </div>
      </div>
      <div style={{ transform: `translateY(${sub.y}px)`, opacity: sub.opacity, marginTop: 44, textAlign: "center" }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 38, color: C.goldHi }}>Learn African languages, interactively.</div>
        <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 30, color: "rgba(244,236,217,0.55)", marginTop: 12 }}>izonbeeli.app · for educators</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  ROOT  ───────────────────────────── */
const B = { problem: [0, 5.4], setup: [5.4, 13], battle: [13, 20.8], payoff: [20.8, 26.4], cta: [26.4, 30] };
export function SkitEducator() {
  return (
    <Stage width={W} height={H} duration={30} background={C.ink} persistKey="skit-educator">
      <Scene start={B.problem[0]} end={B.problem[1]}>{(s) => <ProblemScene {...s} />}</Scene>
      <Scene start={B.setup[0]} end={B.setup[1]}>{(s) => <SetupScene {...s} />}</Scene>
      <Scene start={B.battle[0]} end={B.battle[1]}>{(s) => <BattleScene {...s} />}</Scene>
      <Scene start={B.payoff[0]} end={B.payoff[1]}>{(s) => <PayoffScene {...s} />}</Scene>
      <Scene start={B.cta[0]} end={B.cta[1]} fade={0.4}>{(s) => <CtaScene {...s} />}</Scene>
      <TimeLabel />
    </Stage>
  );
}

export default SkitEducator;
