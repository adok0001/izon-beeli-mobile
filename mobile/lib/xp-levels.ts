export interface LevelInfo {
  level: number;
  title: string;
  titleKey: string;
  legendNumeral?: string;
  currentXP: number; // XP earned within the current level
  xpForNextLevel: number; // XP needed to finish this level
  totalXP: number;
  progress: number; // 0-1
}

interface LevelThreshold {
  level: number;
  cumulativeXP: number;
  title: string;
  titleKey: string;
}

const LEVELS: LevelThreshold[] = [
  { level: 1, cumulativeXP: 0, title: "Newcomer", titleKey: "newcomer" },
  { level: 2, cumulativeXP: 100, title: "Explorer", titleKey: "explorer" },
  { level: 3, cumulativeXP: 300, title: "Listener", titleKey: "listener" },
  { level: 4, cumulativeXP: 600, title: "Speaker", titleKey: "speaker" },
  { level: 5, cumulativeXP: 1000, title: "Scholar", titleKey: "scholar" },
  { level: 6, cumulativeXP: 1500, title: "Storyteller", titleKey: "storyteller" },
  { level: 7, cumulativeXP: 2200, title: "Elder", titleKey: "elder" },
  { level: 8, cumulativeXP: 3000, title: "Master", titleKey: "master" },
  { level: 9, cumulativeXP: 4000, title: "Guardian", titleKey: "guardian" },
  { level: 10, cumulativeXP: 5500, title: "Legend", titleKey: "legend" },
];

const XP_PER_LEGEND_LEVEL = 2000;
const MAX_BASE_LEVEL = 10;
const MAX_BASE_XP = 5500;

export function getLevelInfo(points: number): LevelInfo {
  const totalXP = points;

  if (totalXP >= MAX_BASE_XP) {
    // Legend+ levels
    const xpBeyond = totalXP - MAX_BASE_XP;
    const extraLevels = Math.floor(xpBeyond / XP_PER_LEGEND_LEVEL);
    const level = MAX_BASE_LEVEL + extraLevels;
    const currentXP = xpBeyond % XP_PER_LEGEND_LEVEL;
    const title =
      extraLevels === 0 ? "Legend" : `Legend ${toRoman(extraLevels + 1)}`;

    return {
      level,
      title,
      titleKey: "legend",
      legendNumeral: extraLevels > 0 ? toRoman(extraLevels + 1) : undefined,
      currentXP,
      xpForNextLevel: XP_PER_LEGEND_LEVEL,
      totalXP,
      progress: currentXP / XP_PER_LEGEND_LEVEL,
    };
  }

  let currentLevel = LEVELS[0];
  let nextLevel: LevelThreshold | null = null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXP >= LEVELS[i].cumulativeXP) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] ?? null;
    } else {
      break;
    }
  }

  const xpIntoLevel = totalXP - currentLevel.cumulativeXP;
  const xpForLevel = nextLevel
    ? nextLevel.cumulativeXP - currentLevel.cumulativeXP
    : XP_PER_LEGEND_LEVEL;

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    titleKey: currentLevel.titleKey,
    currentXP: xpIntoLevel,
    xpForNextLevel: xpForLevel,
    totalXP,
    progress: xpForLevel > 0 ? xpIntoLevel / xpForLevel : 1,
  };
}

function toRoman(n: number): string {
  // Simple roman numerals for legend levels II–X
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let result = "";
  let remaining = n;
  for (const [val, sym] of map) {
    while (remaining >= val) {
      result += sym;
      remaining -= val;
    }
  }
  return result;
}
