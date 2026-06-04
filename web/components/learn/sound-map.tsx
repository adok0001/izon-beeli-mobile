"use client";

import { cn } from "@/lib/utils";
import type { Course } from "@/types";
import { useRef, useState } from "react";
import { LocationDrawer } from "./location-drawer";
import { MapNode, deriveNodeState, LEVEL_COLORS, type NodeState } from "./map-node";

// ── Node slot positions (% of container) ─────────────────────────────────────
// Three geographic clusters matching Africa's regions.

const NODE_SLOTS: Record<string, { x: number; y: number }[]> = {
  beginner: [
    { x: 14, y: 30 }, { x: 22, y: 50 }, { x: 13, y: 65 },
    { x: 30, y: 38 }, { x: 28, y: 60 }, { x: 18, y: 78 },
  ],
  intermediate: [
    { x: 46, y: 22 }, { x: 55, y: 38 }, { x: 48, y: 55 },
    { x: 63, y: 30 }, { x: 62, y: 52 }, { x: 55, y: 70 },
  ],
  advanced: [
    { x: 66, y: 68 }, { x: 76, y: 56 }, { x: 72, y: 80 },
    { x: 83, y: 64 }, { x: 86, y: 46 }, { x: 80, y: 84 },
  ],
};

// ── SVG background ────────────────────────────────────────────────────────────

function MapBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        {/* Dot grid pattern */}
        <pattern id="dotgrid" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.3" fill="rgba(255,255,255,0.07)" />
        </pattern>
        {/* Glow filters */}
        <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feFlood floodColor="#10b981" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feFlood floodColor="#3b82f6" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-violet" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feFlood floodColor="#8b5cf6" floodOpacity="0.4" result="color" />
          <feComposite in="color" in2="blur" operator="in" />
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Base dot grid */}
      <rect width="100" height="100" fill="url(#dotgrid)" />

      {/* Faint continent silhouette */}
      <path
        d="M 18,4 L 26,2 L 38,4 L 50,7 L 58,12 L 66,18 L 70,26
           L 76,34 L 80,44 L 82,54 L 78,64 L 72,72 L 62,78
           L 50,83 L 40,86 L 28,90 L 20,93 L 14,88 L 9,78
           L 6,66 L 5,54 L 7,42 L 10,30 L 12,18 L 15,10 Z"
        fill="rgba(255,255,255,0.022)"
        stroke="rgba(255,255,255,0.055)"
        strokeWidth="0.4"
      />

      {/* Region label areas — very faint */}
      <text x="20" y="14" fontSize="2.8" fill="rgba(255,255,255,0.12)" fontFamily="monospace" letterSpacing="0.5">WEST</text>
      <text x="50" y="12" fontSize="2.8" fill="rgba(255,255,255,0.12)" fontFamily="monospace" letterSpacing="0.5">EAST</text>
      <text x="72" y="42" fontSize="2.8" fill="rgba(255,255,255,0.12)" fontFamily="monospace" letterSpacing="0.5">SOUTH</text>

      {/* Compass rose — bottom right */}
      <g transform="translate(93, 88) scale(0.8)" opacity="0.12">
        <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="0.5" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke="white" strokeWidth="0.5" />
        <polygon points="0,-5 -1,-2 1,-2" fill="white" />
        <text x="-0.5" y="-6.5" fontSize="2" fill="white" fontFamily="monospace">N</text>
      </g>

      {/* Coordinate ticks along edges */}
      {[20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={v} y1="0" x2={v} y2="1.5" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
          <line x1="0" y1={v} x2="1.5" y2={v} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        </g>
      ))}
    </svg>
  );
}

// ── Connection paths between nodes ────────────────────────────────────────────

interface PathsLayerProps {
  courses: Course[];
  nodeStates: Record<string, NodeState>;
}

function PathsLayer({ courses, nodeStates }: Readonly<PathsLayerProps>) {
  const levels: (keyof typeof NODE_SLOTS)[] = ["beginner", "intermediate", "advanced"];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {levels.map((level) => {
        const levelCourses = courses
          .filter((c) => c.level === level)
          .slice(0, NODE_SLOTS[level].length);
        const colors = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS];

        return levelCourses.slice(0, -1).map((course, i) => {
          const from = NODE_SLOTS[level][i];
          const to = NODE_SLOTS[level][i + 1];
          const nextCourse = levelCourses[i + 1];

          const fromState = nodeStates[course.id] ?? deriveNodeState(course);
          const toState = nextCourse ? (nodeStates[nextCourse.id] ?? deriveNodeState(nextCourse)) : "locked";
          const isLit = fromState === "complete" || toState !== "locked";

          // Midpoint with slight curve offset
          const mx = (from.x + to.x) / 2 + (Math.random() < 0.5 ? 3 : -3);
          const my = (from.y + to.y) / 2 + (Math.random() < 0.5 ? 2 : -2);
          const d = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;

          return (
            <path
              key={`${course.id}-path`}
              d={d}
              fill="none"
              stroke={isLit ? colors.ring : "rgba(255,255,255,0.06)"}
              strokeWidth={isLit ? "0.6" : "0.4"}
              strokeDasharray={isLit ? "none" : "1.5 1"}
              style={{
                filter: isLit ? `drop-shadow(0 0 1.5px ${colors.glow})` : "none",
                transition: "stroke 0.6s ease, stroke-width 0.4s ease",
              }}
            />
          );
        });
      })}
    </svg>
  );
}

// ── Region labels (positioned over the map) ───────────────────────────────────

function RegionLabel({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

// ── SoundMap ──────────────────────────────────────────────────────────────────

interface SoundMapProps {
  courses: Course[];
}

export function SoundMap({ courses }: Readonly<SoundMapProps>) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>(() =>
    Object.fromEntries(courses.map((c) => [c.id, deriveNodeState(c)]))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleUnlock(courseId: string) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    // Stop any previous audio
    audioRef.current?.pause();

    setNodeStates((prev) => ({ ...prev, [courseId]: "listening" }));
    setSelectedId(courseId);

    // TODO: replace with course.previewAudioUrl when available
    const audio = new Audio();
    audioRef.current = audio;

    const finish = () => setNodeStates((prev) => ({ ...prev, [courseId]: "unlocked" }));
    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });

    // No audio src yet — auto-unlock after a brief simulated listen
    setTimeout(finish, 1500);
  }

  const selectedCourse = selectedId ? (courses.find((c) => c.id === selectedId) ?? null) : null;
  const selectedState = selectedId ? (nodeStates[selectedId] ?? "locked") : "locked";

  return (
    <div className="relative w-full">
      {/* Map container — 16:9 aspect, dark navy background */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl",
          "border border-white/[0.07]",
        )}
        style={{
          aspectRatio: "16 / 9",
          background: "radial-gradient(ellipse at 35% 45%, #0d1226 0%, #05060e 65%)",
          boxShadow: "inset 0 0 80px -20px rgba(0,0,0,0.8)",
        }}
      >
        {/* SVG background */}
        <MapBackground />

        {/* Connection paths */}
        <PathsLayer courses={courses} nodeStates={nodeStates} />

        {/* Region labels */}
        <RegionLabel x={8} y={8} label="West Africa" color="#34d399" />
        <RegionLabel x={44} y={8} label="East Africa" color="#60a5fa" />
        <RegionLabel x={70} y={36} label="Southern Africa" color="#a78bfa" />

        {/* Course nodes */}
        {courses.map((course, i) => {
          const slots = NODE_SLOTS[course.level] ?? NODE_SLOTS.beginner;
          const levelCourses = courses.filter((c) => c.level === course.level);
          const levelIndex = levelCourses.findIndex((c) => c.id === course.id);
          const slot = slots[Math.min(levelIndex, slots.length - 1)];
          if (!slot) return null;

          return (
            <MapNode
              key={course.id}
              course={course}
              nodeState={nodeStates[course.id] ?? "locked"}
              position={slot}
              isSelected={selectedId === course.id}
              onSelect={() => setSelectedId(course.id)}
              onUnlock={handleUnlock}
            />
          );
        })}

        {/* Bottom-right watermark */}
        <div className="absolute bottom-3 right-4 pointer-events-none">
          <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">
            Sound Map · Beeli
          </span>
        </div>
      </div>

      {/* Hint strip */}
      <p className="mt-3 text-center text-[11px] text-neutral-600 uppercase tracking-wider">
        Click a <span className="text-neutral-500">locked node</span> to hear its soundscape — identify the location to unlock
      </p>

      {/* Location drawer */}
      <LocationDrawer
        course={selectedCourse}
        nodeState={selectedState}
        onClose={() => setSelectedId(null)}
        onUnlock={handleUnlock}
      />
    </div>
  );
}
