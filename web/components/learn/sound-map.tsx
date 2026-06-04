"use client";

import { cn } from "@/lib/utils";
import type { Course, MapNodeConfig } from "@/types";
import { useRef, useState } from "react";
import { LocationDrawer } from "./location-drawer";
import { MapNode, deriveNodeState, type NodeState } from "./map-node";

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
        <pattern id="dotgrid" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.3" fill="rgba(255,255,255,0.07)" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#dotgrid)" />
      <path
        d="M 18,4 L 26,2 L 38,4 L 50,7 L 58,12 L 66,18 L 70,26
           L 76,34 L 80,44 L 82,54 L 78,64 L 72,72 L 62,78
           L 50,83 L 40,86 L 28,90 L 20,93 L 14,88 L 9,78
           L 6,66 L 5,54 L 7,42 L 10,30 L 12,18 L 15,10 Z"
        fill="rgba(255,255,255,0.022)"
        stroke="rgba(255,255,255,0.055)"
        strokeWidth="0.4"
      />
      {/* Compass rose */}
      <g transform="translate(93, 88) scale(0.8)" opacity="0.12">
        <line x1="0" y1="-5" x2="0" y2="5" stroke="white" strokeWidth="0.5" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke="white" strokeWidth="0.5" />
        <polygon points="0,-5 -1,-2 1,-2" fill="white" />
        <text x="-0.5" y="-6.5" fontSize="2" fill="white" fontFamily="monospace">N</text>
      </g>
      {[20, 40, 60, 80].map((v) => (
        <g key={v}>
          <line x1={v} y1="0" x2={v} y2="1.5" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
          <line x1="0" y1={v} x2="1.5" y2={v} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
        </g>
      ))}
    </svg>
  );
}

// ── Connection paths ───────────────────────────────────────────────────────────
// Connects nodes within the same zone in `order` sequence.

interface PathsLayerProps {
  mapNodes: MapNodeConfig[];
  nodeStates: Record<string, NodeState>;
  zoneColor: (zoneName: string) => string;
}

function PathsLayer({ mapNodes, nodeStates, zoneColor }: Readonly<PathsLayerProps>) {
  const zones = Array.from(new Set(mapNodes.map((n) => n.zoneName)));

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {zones.map((zone) => {
        const zoneNodes = mapNodes
          .filter((n) => n.zoneName === zone)
          .sort((a, b) => a.order - b.order);
        const color = zoneColor(zone);

        return zoneNodes.slice(0, -1).map((node, i) => {
          const next = zoneNodes[i + 1];
          const fromState = nodeStates[node.courseId] ?? "locked";
          const toState = nodeStates[next.courseId] ?? "locked";
          const isLit = fromState === "complete" || toState !== "locked";

          // Slight curve via midpoint offset
          const mx = (node.x + next.x) / 2;
          const my = (node.y + next.y) / 2 - 4;
          const d = `M ${node.x} ${node.y} Q ${mx} ${my} ${next.x} ${next.y}`;

          return (
            <path
              key={`${node.id}-path`}
              d={d}
              fill="none"
              stroke={isLit ? color : "rgba(255,255,255,0.06)"}
              strokeWidth={isLit ? "0.6" : "0.4"}
              strokeDasharray={isLit ? undefined : "1.5 1"}
              style={{
                filter: isLit ? `drop-shadow(0 0 1.5px ${color})` : "none",
                transition: "stroke 0.6s ease",
              }}
            />
          );
        });
      })}
    </svg>
  );
}

// ── Zone label ─────────────────────────────────────────────────────────────────
// Positioned at the centroid of its nodes.

function ZoneLabel({ nodes, zoneName, color }: { nodes: MapNodeConfig[]; zoneName: string; color: string }) {
  const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
  const cy = Math.min(...nodes.map((n) => n.y)) - 8;
  if (cy < 3) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${cx}%`, top: `${Math.max(3, cy)}%`, transform: "translateX(-50%)" }}
    >
      <span
        className="text-[9px] font-bold uppercase tracking-[0.3em] whitespace-nowrap"
        style={{ color, opacity: 0.35 }}
      >
        {zoneName}
      </span>
    </div>
  );
}

// ── Zone color mapping ────────────────────────────────────────────────────────
// Assigns colors to zones in stable order (first seen = emerald, second = blue, third = violet).

const ZONE_PALETTE = ["#34d399", "#60a5fa", "#a78bfa", "#fb923c", "#f472b6"];

function useZoneColors(mapNodes: MapNodeConfig[]) {
  const zones = Array.from(new Set(mapNodes.map((n) => n.zoneName)));
  const map: Record<string, string> = {};
  zones.forEach((z, i) => { map[z] = ZONE_PALETTE[i % ZONE_PALETTE.length]; });
  return (zoneName: string) => map[zoneName] ?? ZONE_PALETTE[0];
}

// ── SoundMap ──────────────────────────────────────────────────────────────────

interface SoundMapProps {
  courses: Course[];
  mapNodes: MapNodeConfig[];
}

export function SoundMap({ courses, mapNodes }: Readonly<SoundMapProps>) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const getZoneColor = useZoneColors(mapNodes);

  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>(() => {
    const course = Object.fromEntries(courses.map((c) => [c.id, deriveNodeState(c)]));
    return course;
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  function handleUnlock(courseId: string) {
    const node = mapNodes.find((n) => n.courseId === courseId);
    audioRef.current?.pause();
    setNodeStates((prev) => ({ ...prev, [courseId]: "listening" }));
    setSelectedCourseId(courseId);

    const finish = () => setNodeStates((prev) => ({ ...prev, [courseId]: "unlocked" }));

    if (node?.previewAudioUrl) {
      const audio = new Audio(node.previewAudioUrl);
      audioRef.current = audio;
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      audio.play().catch(finish);
    } else {
      setTimeout(finish, 1500);
    }
  }

  const zones = Array.from(new Set(mapNodes.map((n) => n.zoneName)));
  const selectedCourse = selectedCourseId ? (courses.find((c) => c.id === selectedCourseId) ?? null) : null;
  const selectedState = selectedCourseId ? (nodeStates[selectedCourseId] ?? "locked") : "locked";

  return (
    <div className="relative w-full">
      <div
        className={cn("relative w-full overflow-hidden rounded-2xl border border-white/[0.07]")}
        style={{
          aspectRatio: "16 / 9",
          background: "radial-gradient(ellipse at 35% 45%, #0d1226 0%, #05060e 65%)",
          boxShadow: "inset 0 0 80px -20px rgba(0,0,0,0.8)",
        }}
      >
        <MapBackground />
        <PathsLayer mapNodes={mapNodes} nodeStates={nodeStates} zoneColor={getZoneColor} />

        {/* Zone labels at centroid of each zone */}
        {zones.map((zone) => {
          const zoneNodes = mapNodes.filter((n) => n.zoneName === zone);
          return (
            <ZoneLabel
              key={zone}
              nodes={zoneNodes}
              zoneName={zone}
              color={getZoneColor(zone)}
            />
          );
        })}

        {/* Course nodes */}
        {mapNodes.map((node) => {
          const course = courses.find((c) => c.id === node.courseId);
          if (!course) return null;
          return (
            <MapNode
              key={node.id}
              course={course}
              nodeState={nodeStates[course.id] ?? "locked"}
              position={{ x: node.x, y: node.y }}
              isSelected={selectedCourseId === course.id}
              onSelect={() => setSelectedCourseId(course.id)}
              onUnlock={handleUnlock}
              label={node.communityName}
            />
          );
        })}

        <div className="absolute bottom-3 right-4 pointer-events-none">
          <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">
            Sound Map · Beeli
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-neutral-600 uppercase tracking-wider">
        Click a <span className="text-neutral-500">locked node</span> to hear its soundscape — identify the location to unlock
      </p>

      <LocationDrawer
        course={selectedCourse}
        nodeState={selectedState}
        onClose={() => setSelectedCourseId(null)}
        onUnlock={handleUnlock}
      />
    </div>
  );
}
