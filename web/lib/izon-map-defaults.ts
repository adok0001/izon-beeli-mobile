import type { Course, MapNodeConfig } from "@/types";

// ── Ịzọn (Niger Delta) default node positions ─────────────────────────────────
// Used as a fallback when a language has no admin-configured map nodes.
// Positions reflect real communities in Bayelsa and Delta states.
// Zones replace Beginner/Intermediate/Advanced with culturally grounded names.

const IZON_SLOTS: {
  zoneName: string;
  level: "beginner" | "intermediate" | "advanced";
  nodes: { communityName: string; x: number; y: number }[];
}[] = [
  {
    zoneName: "The Waterside",
    level: "beginner",
    nodes: [
      { communityName: "Yenagoa Town Square",  x: 20, y: 35 },
      { communityName: "Ekeki Market, Yenagoa", x: 28, y: 52 },
      { communityName: "Kaiama Waterfront",     x: 15, y: 64 },
    ],
  },
  {
    zoneName: "Creek Towns",
    level: "intermediate",
    nodes: [
      { communityName: "Brass Riverside",  x: 46, y: 38 },
      { communityName: "Nembe Junction",   x: 55, y: 54 },
      { communityName: "Ogbia Ferry Point", x: 48, y: 68 },
    ],
  },
  {
    zoneName: "Deep Delta",
    level: "advanced",
    nodes: [
      { communityName: "Patani Boat Yard", x: 68, y: 60 },
      { communityName: "Burutu Fishery",   x: 76, y: 50 },
      { communityName: "Forcados Port",    x: 83, y: 44 },
    ],
  },
];

export function generateIzonDefaults(courses: Course[]): MapNodeConfig[] {
  const nodes: MapNodeConfig[] = [];

  for (const zone of IZON_SLOTS) {
    const levelCourses = courses
      .filter((c) => c.level === zone.level)
      .slice(0, zone.nodes.length);

    levelCourses.forEach((course, i) => {
      const slot = zone.nodes[i];
      nodes.push({
        id: `default-${course.id}`,
        languageId: course.language,
        courseId: course.id,
        communityName: slot.communityName,
        zoneName: zone.zoneName,
        x: slot.x,
        y: slot.y,
        order: i,
      });
    });
  }

  return nodes;
}
