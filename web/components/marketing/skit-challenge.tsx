"use client";

// skit-challenge.tsx — "#BeeliChallenge" — a 15s vertical (9:16) viral-loop skit.
// A learner levels up to a "Guardian of Igbo" title, shares the identity card, a friend
// gets tagged and joins. Built around Beeli's gamification + share-card aesthetic.

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
  ink: "#12100C",
  ink2: "#1B1813",
  card: "#14161D",
  cardHi: "#1E212B",
  purple: "#8B5CF6", // ancestral purple — achievements
  purpleHi: "#A78BFA",
};

// A simple phone shell.
function Phone({
  children,
  w = 560,
  accent = C.coolHi,
  lift = 0,
  glow = 0,
}: {
  children: React.ReactNode;
  w?: number;
  accent?: string;
  lift?: number;
  glow?: number;
}) {
  return (
    <div style={{ width: w, height: w * 1.92, borderRadius: 76, background: C.ink2, padding: 18, border: `2px solid ${accent}`, boxShadow: `0 ${28 + lift}px 90px rgba(0,0,0,0.55)${glow > 0 ? `, 0 0 ${glow}px rgba(139,92,246,${(0.4 * glow) / 80})` : ""}` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 60, overflow: "hidden", background: C.paper, position: "relative" }}>{children}</div>
    </div>
  );
}

// The shareable identity card — matches Beeli's dark share-card aesthetic.
function IdentityCard({ scale = 1, glow = 1 }: { scale?: number; glow?: number; t?: number }) {
  return (
    <div style={{ position: "relative", width: 720, transform: `scale(${scale})`, transformOrigin: "center" }}>
      <div style={{ position: "absolute", inset: -60, borderRadius: 60, background: `radial-gradient(circle at 50% 46%, rgba(139,92,246,${0.5 * glow}) 0%, rgba(139,92,246,0) 64%)` }} />
      <div style={{ position: "relative", background: C.card, borderRadius: 44, padding: "52px 56px", overflow: "hidden", border: "1px solid rgba(167,139,250,0.28)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ position: "absolute", top: -90, right: -70, width: 360, height: 360, borderRadius: "50%", background: "rgba(139,92,246,0.14)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, background: C.purpleHi }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 28, color: C.purpleHi, letterSpacing: "0.16em" }}>BEELI</span>
          </div>
          <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 26, color: "rgba(244,236,217,0.65)", border: "1px solid rgba(244,236,217,0.2)", borderRadius: 999, padding: "8px 22px" }}>igbo</span>
        </div>
        <div style={{ marginTop: 56, fontFamily: TEXT, fontWeight: 600, fontSize: 34, color: "rgba(244,236,217,0.6)" }}>I am a</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 130, color: C.cream, lineHeight: 0.92, letterSpacing: "-0.03em", marginTop: 6 }}>Guardian</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 90, color: C.purpleHi, lineHeight: 1, letterSpacing: "-0.02em" }}>of Igbo</div>
        <div style={{ marginTop: 44, height: 1, background: "rgba(244,236,217,0.16)" }} />
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: MONO, fontSize: 28, color: C.goldHi }}>Level 7 · 1,240 XP</div>
          <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 24, color: "rgba(244,236,217,0.45)" }}>izonbeeli.app</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 1 · LEVEL UP  ───────────────────────────── */
function LevelUpScene({ localTime: lt }: { localTime: number }) {
  const ring = clamp(lt / 1.6, 0, 1);
  const burst = pop(lt, 1.6, 0.6, 0);
  const titleP = pop(lt, 2.1, 0.6, 22);
  const lvl = Math.min(7, Math.round(interpolate([0, 1.6], [1, 7], Easing.easeOutCubic)(lt)));
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 38%, ${C.cool}, ${C.ink} 74%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Phone glow={lt > 1.6 ? 80 : 0}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(110% 70% at 50% 40%, ${C.paper}, ${C.cream2} 92%)` }} />
        <div style={{ position: "absolute", top: 40, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 44px" }}>
          <BeeliMark size={40} color={C.ink} accent={C.red} />
          <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 26, color: C.purple, background: "rgba(139,92,246,0.12)", padding: "8px 20px", borderRadius: 999 }}>Ịgbò</div>
        </div>
        {/* burst rays */}
        {burst.opacity > 0 &&
          Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const len = 220 + 60 * Math.sin(lt * 5 + i);
            return <div key={i} style={{ position: "absolute", left: "50%", top: 720, width: 6, height: len, background: i % 2 ? C.purpleHi : C.gold, opacity: burst.opacity * 0.5, transform: `translate(-50%,-50%) rotate(${a}rad) translateY(-200px)`, transformOrigin: "center", borderRadius: 3 }} />;
          })}
        {/* progress ring + level */}
        <div style={{ position: "absolute", left: "50%", top: 720, transform: "translate(-50%,-50%)" }}>
          <svg width="340" height="340" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="170" cy="170" r="150" stroke="rgba(27,24,19,0.1)" strokeWidth="18" fill="none" />
            <circle cx="170" cy="170" r="150" stroke={C.purple} strokeWidth="18" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 150} strokeDashoffset={(1 - ring) * 2 * Math.PI * 150} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 26, color: "rgba(27,24,19,0.5)", letterSpacing: "0.12em" }}>LEVEL</div>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 160, color: C.ink, lineHeight: 0.9 }}>{lvl}</div>
          </div>
        </div>
        {/* new title */}
        <div style={{ position: "absolute", top: 1100, left: 44, right: 44, textAlign: "center", opacity: titleP.opacity, transform: `translateY(${titleP.y}px) scale(${titleP.scale})` }}>
          <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 30, color: "rgba(27,24,19,0.5)" }}>New title unlocked</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 78, color: C.purple, marginTop: 8, letterSpacing: "-0.02em" }}>Guardian</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, color: C.ink, lineHeight: 1.1 }}>of Igbo</div>
        </div>
        {/* ladder */}
        <div style={{ position: "absolute", bottom: 70, left: 44, right: 44, display: "flex", justifyContent: "space-between", fontFamily: TEXT, fontWeight: 600, fontSize: 24 }}>
          {["Newcomer", "Elder", "Guardian", "Legend"].map((label, i) => (
            <span key={label} style={{ color: i === 2 ? C.purple : "rgba(27,24,19,0.28)", borderBottom: i === 2 ? `3px solid ${C.purple}` : "3px solid transparent", paddingBottom: 6 }}>
              {label}
            </span>
          ))}
        </div>
      </Phone>
    </div>
  );
}

/* ─────────────────────────────  SCENE 2 · SHARE THE CARD  ───────────────────────────── */
function ShareScene({ localTime: lt }: { localTime: number }) {
  const cardP = pop(lt, 0.2, 0.7, 30);
  const tapShow = lt > 1.8;
  const dareP = pop(lt, 2.6, 0.6, 16);
  const float = 6 * Math.sin(lt * 1.5);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 40%, ${C.cardHi}, ${C.ink} 80%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${cardP.y + float}px) scale(${cardP.scale})`, opacity: cardP.opacity }}>
        <IdentityCard glow={clamp((lt - 0.4) / 1, 0, 1)} t={lt} />
      </div>
      {/* dare line */}
      <div style={{ marginTop: 70, textAlign: "center", opacity: dareP.opacity, transform: `translateY(${dareP.y}px)`, maxWidth: 860 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 50, color: C.cream, lineHeight: 1.12, letterSpacing: "-0.01em" }}>
          Tag someone who should
          <br />
          speak their language.
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 44, color: C.purpleHi, marginTop: 22 }}>#BeeliChallenge</div>
      </div>
      {/* share button tap */}
      {tapShow && (() => {
        const p = pop(lt, 1.8, 0.4, 12);
        const press = 1 - 0.05 * clamp(Math.sin((lt - 1.8) * 6), 0, 1);
        return (
          <div style={{ position: "absolute", bottom: 70, left: "50%", transform: `translateX(-50%) scale(${p.scale * press})`, opacity: p.opacity, display: "flex", alignItems: "center", gap: 16, background: C.gold, color: C.ink, fontFamily: TEXT, fontWeight: 700, fontSize: 40, padding: "26px 64px", borderRadius: 999, boxShadow: "0 18px 50px rgba(227,165,44,0.4)" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12M12 3l-5 5M12 3l5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" stroke={C.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Share
          </div>
        );
      })()}
    </div>
  );
}

/* ─────────────────────────────  SCENE 3 · A FRIEND SEES IT  ───────────────────────────── */
function FriendScene({ localTime: lt }: { localTime: number }) {
  const phoneP = pop(lt, 0.2, 0.6, 30);
  const msgP = pop(lt, 0.9, 0.5, 18);
  const replyP = pop(lt, 1.9, 0.5, 16);
  const joinP = pop(lt, 2.9, 0.5, 14);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 50% 36%, ${C.cool}, ${C.ink} 76%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${phoneP.y}px) scale(${phoneP.scale})`, opacity: phoneP.opacity }}>
        <Phone>
          <div style={{ position: "absolute", inset: 0, background: C.cream }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110, background: C.ink2, display: "flex", alignItems: "center", padding: "0 40px", gap: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: C.redHi }} />
            <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 32, color: C.cream }}>Ada</div>
          </div>
          {/* incoming: the shared card thumbnail */}
          <div style={{ position: "absolute", top: 170, left: 40, opacity: msgP.opacity, transform: `translateY(${msgP.y}px)` }}>
            <div style={{ width: 380, background: C.card, borderRadius: 28, padding: "26px 28px", border: "1px solid rgba(167,139,250,0.3)", boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: C.purpleHi, letterSpacing: "0.14em" }}>BEELI · IGBO</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 50, color: C.cream, marginTop: 12, lineHeight: 0.96 }}>
                Guardian
                <br />
                <span style={{ fontSize: 34, color: C.purpleHi }}>of Igbo</span>
              </div>
              <div style={{ fontFamily: MONO, fontSize: 20, color: C.goldHi, marginTop: 16 }}>#BeeliChallenge</div>
            </div>
            <div style={{ fontFamily: TEXT, fontSize: 22, color: "rgba(27,24,19,0.45)", marginTop: 10, marginLeft: 6 }}>Ada tagged you</div>
          </div>
          {/* reply bubble */}
          <div style={{ position: "absolute", top: 720, right: 40, opacity: replyP.opacity, transform: `translateY(${replyP.y}px)`, maxWidth: 440 }}>
            <div style={{ background: C.river, color: C.cream, fontFamily: TEXT, fontWeight: 600, fontSize: 34, padding: "24px 30px", borderRadius: "30px 30px 8px 30px", lineHeight: 1.2 }}>ok now I have to learn mine</div>
          </div>
          {/* join button */}
          <div style={{ position: "absolute", bottom: 80, left: 44, right: 44, opacity: joinP.opacity, transform: `scale(${joinP.scale})` }}>
            <div style={{ background: C.purple, color: "#fff", fontFamily: TEXT, fontWeight: 700, fontSize: 38, textAlign: "center", padding: "28px", borderRadius: 26, boxShadow: "0 16px 40px rgba(139,92,246,0.4)" }}>Start Igbo — free</div>
          </div>
        </Phone>
      </div>
    </div>
  );
}

/* ─────────────────────────────  SCENE 4 · CTA  ───────────────────────────── */
function CtaScene({ localTime: lt }: { localTime: number }) {
  const mark = pop(lt, 0.2, 0.6, 20);
  const tag = pop(lt, 0.8, 0.6, 16);
  return (
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(130% 90% at 50% 32%, ${C.ink2}, ${C.ink} 76%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 12, display: "flex" }}>
        <div style={{ flex: 1, background: C.purple }} />
        <div style={{ flex: 1, background: C.gold }} />
        <div style={{ flex: 1, background: C.red }} />
      </div>
      <div style={{ transform: `translateY(${mark.y}px) scale(${mark.scale})`, opacity: mark.opacity, marginBottom: 60 }}>
        <BeeliMark size={140} color={C.cream} accent={C.purpleHi} t={lt} animated />
      </div>
      <div style={{ transform: `translateY(${tag.y}px)`, opacity: tag.opacity, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, color: C.purpleHi, letterSpacing: "-0.01em" }}>#BeeliChallenge</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 64, color: C.cream, marginTop: 26, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
          Earn your title.
          <br />
          Then pass it on.
        </div>
        <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 38, color: C.goldHi, marginTop: 36 }}>Free. Audio-first.</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────  ROOT  ───────────────────────────── */
const B = { lvl: [0, 4.4], share: [4.4, 9.4], friend: [9.4, 12.6], cta: [12.6, 15] };
export function SkitChallenge() {
  return (
    <Stage width={W} height={H} duration={15} background={C.ink} persistKey="skit-challenge">
      <Scene start={B.lvl[0]} end={B.lvl[1]}>{(s) => <LevelUpScene {...s} />}</Scene>
      <Scene start={B.share[0]} end={B.share[1]}>{(s) => <ShareScene {...s} />}</Scene>
      <Scene start={B.friend[0]} end={B.friend[1]}>{(s) => <FriendScene {...s} />}</Scene>
      <Scene start={B.cta[0]} end={B.cta[1]} fade={0.4}>{(s) => <CtaScene {...s} />}</Scene>
      <TimeLabel />
    </Stage>
  );
}

export default SkitChallenge;
