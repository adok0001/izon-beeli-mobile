"use client";

import { useInteractiveStory } from "@/lib/hooks/use-discover";
import type { StoryChoice } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const GRAIN_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

function FilmstripProgress({ total, current }: { total: number; current: number }) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex gap-1 px-4 pt-4 pb-3 pointer-events-none"
      style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-0.5 rounded-full"
          style={{
            background:
              i < current
                ? "#C4862A"
                : i === current
                ? "rgba(196,134,42,0.6)"
                : "rgba(255,255,255,0.18)",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

function ChoiceOverlay({
  choices,
  onSelect,
}: {
  choices: StoryChoice[];
  onSelect: (nextId: string) => void;
}) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 px-6 pb-12 pt-8"
      style={{
        backdropFilter: "blur(20px)",
        background: "linear-gradient(to top, rgba(7,8,15,0.95), rgba(7,8,15,0.6))",
        animation: "slideUp 0.3s ease",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      <p
        className="text-center mb-5 uppercase"
        style={{ fontSize: 10, fontWeight: 800, letterSpacing: 3, color: "rgba(196,134,42,0.8)" }}
      >
        — WHAT DO YOU DO? —
      </p>
      <div className="flex flex-col gap-2.5 max-w-lg mx-auto">
        {choices.map((choice, i) => (
          <ChoiceButton key={choice.id} choice={choice} index={i} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function ChoiceButton({
  choice,
  index,
  onSelect,
}: {
  choice: StoryChoice;
  index: number;
  onSelect: (nextId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onSelect(choice.nextSceneId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all duration-150"
      style={{
        background: hovered ? "rgba(196,134,42,0.12)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${hovered ? "rgba(196,134,42,0.5)" : "rgba(255,255,255,0.12)"}`,
      }}
    >
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors duration-150"
        style={{
          background: hovered ? "rgba(196,134,42,0.25)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${hovered ? "rgba(196,134,42,0.6)" : "rgba(255,255,255,0.15)"}`,
          color: hovered ? "#C4862A" : "#9A9480",
        }}
      >
        {index + 1}
      </div>
      <span className="text-sm font-semibold leading-5" style={{ color: "#F7F2E8" }}>
        {choice.text}
      </span>
    </button>
  );
}

export default function StoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: story } = useInteractiveStory(id);

  const [history, setHistory] = useState<string[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [sceneOpacity, setSceneOpacity] = useState(1);
  const [sceneTranslateX, setSceneTranslateX] = useState(0);
  const [choiceVisible, setChoiceVisible] = useState(false);

  useEffect(() => {
    if (story && !currentSceneId) setCurrentSceneId(story.initialSceneId);
  }, [story, currentSceneId]);

  useEffect(() => {
    if (!story || !currentSceneId) return;
    const scene = story.scenes[currentSceneId];
    if (scene?.type === "choice") {
      const t = setTimeout(() => setChoiceVisible(true), 600);
      return () => clearTimeout(t);
    } else {
      setChoiceVisible(false);
    }
  }, [currentSceneId, story]);

  const transition = useCallback(
    (nextId: string, dir: "left" | "right") => {
      if (animating) return;
      setAnimating(true);
      setSceneOpacity(0);
      setSceneTranslateX(dir === "right" ? -40 : 40);
      setTimeout(() => {
        setCurrentSceneId(nextId);
        setSceneTranslateX(dir === "right" ? 40 : -40);
        setTimeout(() => {
          setSceneOpacity(1);
          setSceneTranslateX(0);
          setTimeout(() => setAnimating(false), 300);
        }, 50);
      }, 200);
    },
    [animating]
  );

  const goForward = useCallback(() => {
    if (!story || !currentSceneId || animating) return;
    const scene = story.scenes[currentSceneId];
    if (scene?.type === "narrative" && scene.nextSceneId) {
      setHistory((h) => [...h, currentSceneId]);
      transition(scene.nextSceneId, "right");
    }
  }, [story, currentSceneId, animating, transition]);

  const goBack = useCallback(() => {
    if (animating) return;
    if (history.length === 0) { router.push("/culture"); return; }
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    transition(prev, "left");
  }, [history, router, animating, transition]);

  const handleChoice = useCallback(
    (nextId: string) => {
      if (!currentSceneId) return;
      setHistory((h) => [...h, currentSceneId]);
      setChoiceVisible(false);
      setTimeout(() => transition(nextId, "right"), 200);
    },
    [currentSceneId, transition]
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goForward();
      if (e.key === "ArrowLeft") goBack();
      if (e.key === "Escape") router.push("/culture");
      if (story && currentSceneId) {
        const scene = story.scenes[currentSceneId];
        if (scene?.type === "choice" && scene.choices) {
          const idx = parseInt(e.key, 10) - 1;
          if (idx >= 0 && idx < scene.choices.length) {
            handleChoice(scene.choices[idx].nextSceneId);
          }
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goForward, goBack, router, story, currentSceneId, handleChoice]);

  if (!story || !currentSceneId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#07080F" }}>
        <p className="text-sm" style={{ color: "#F7F2E8" }}>Loading story…</p>
      </div>
    );
  }

  const scene = story.scenes[currentSceneId];
  if (!scene) return null;

  const sceneIndex = history.length;
  const totalScenes = Object.keys(story.scenes).length;

  return (
    <div
      className="fixed inset-0"
      style={{ background: scene.gradient[0], transition: "background-color 0.6s ease" }}
    >
      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: GRAIN_URI, opacity: 0.05 }}
      />
      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, ${scene.gradient[1]} 100%)`,
        }}
      />

      <FilmstripProgress total={totalScenes} current={sceneIndex} />

      {/* Emoji bg */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span style={{ fontSize: 160, opacity: 0.06 }}>{scene.backgroundEmoji}</span>
      </div>

      {/* Exit top-left */}
      <button
        onClick={() => router.push("/culture")}
        className="absolute top-12 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150"
        style={{
          background: "rgba(13,15,26,0.5)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(247,242,232,0.7)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#F7F2E8")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(247,242,232,0.7)")}
      >
        ← Exit
      </button>

      {/* Scene counter top-right */}
      <div className="absolute top-12 right-4 z-20">
        <span
          className="uppercase"
          style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: "rgba(247,242,232,0.4)" }}
        >
          SCENE {sceneIndex + 1} / {totalScenes}
        </span>
      </div>

      {/* Central content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-8"
        style={{
          opacity: sceneOpacity,
          transform: `translateX(${sceneTranslateX}px)`,
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {scene.title && (
          <p
            className="text-center mb-5 uppercase"
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
              color: "rgba(196,134,42,0.8)",
            }}
          >
            {scene.title}
          </p>
        )}
        <p
          className="text-center max-w-[640px]"
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#F7F2E8",
            lineHeight: "30px",
            textShadow: "0 2px 16px rgba(0,0,0,0.7)",
          }}
        >
          {scene.text}
        </p>
      </div>

      {/* Tap zones — narrative only */}
      {scene.type === "narrative" && !choiceVisible && (
        <>
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="absolute left-0 top-20 bottom-0 w-[30%] flex items-center justify-start pl-6 opacity-0 hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous scene"
            >
              <span style={{ fontSize: 28, color: "rgba(255,255,255,0.3)" }}>‹</span>
            </button>
          )}
          {scene.nextSceneId && (
            <button
              onClick={goForward}
              className="absolute right-0 top-20 bottom-0 w-[30%] flex items-center justify-end pr-6 opacity-0 hover:opacity-100 transition-opacity duration-200"
              aria-label="Next scene"
            >
              <span style={{ fontSize: 28, color: "rgba(255,255,255,0.4)" }}>›</span>
            </button>
          )}
        </>
      )}

      {/* Conclusion CTA */}
      {scene.type === "conclusion" && (
        <button
          onClick={() => router.push("/culture")}
          className="absolute bottom-12 px-6 py-3 rounded-full text-sm font-bold transition-colors duration-150"
          style={{
            background: "rgba(196,134,42,0.2)",
            border: "1px solid rgba(196,134,42,0.5)",
            color: "#C4862A",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,134,42,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,134,42,0.2)")}
        >
          Return to Culture
        </button>
      )}

      {/* Choice overlay */}
      {choiceVisible && scene.type === "choice" && scene.choices && (
        <ChoiceOverlay choices={scene.choices} onSelect={handleChoice} />
      )}

      {/* Keyboard hint */}
      {scene.type !== "conclusion" && !choiceVisible && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <span
            className="uppercase"
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: "rgba(247,242,232,0.2)",
            }}
          >
            {scene.type === "choice"
              ? "1 / 2 to choose · Esc to exit"
              : "→ to continue · Esc to exit"}
          </span>
        </div>
      )}
    </div>
  );
}
