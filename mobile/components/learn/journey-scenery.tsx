import { type ReactNode } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import type { JourneyArea } from "@/lib/journey";
import type { CourseType } from "@/types";

/**
 * Themed scenery drawn behind the journey nodes — the illustrated "story map"
 * world the path winds through (an Ijaw greetings village, a stilt house, a
 * cooking fire, a riverside market, the creeks, and the modern city). Ported
 * from the design prototype's parchment scene.
 *
 * Like the {@link JOURNEY} palette and the share card, this immersive scene is
 * intentionally mode-invariant: these exact earth tones come from the design
 * and are documented here in one place rather than scattered as raw hex. Bronze
 * accents reuse the Museum accent (#C4862A) so the world stays in-system.
 */
const SCENE = {
  shadow: "#000",
  hutWall: "#C9A36B",
  hutWall2: "#D2AE76",
  hutWall3: "#CDA876",
  hutStroke: "#A9824A",
  roofStroke: "#9C7338",
  door: "#6E4A22",
  shutter: "#86643A",
  post: "#7A5326",
  postLight: "#8A5A2B",
  waterline: "#9DBEC2",
  foliage: "#7FA266",
  foliageMid: "#33614A",
  foliageDark: "#1F3A32",
  trunk: "#8A5A2B",
  fireOuter: "#FB923C",
  fireInner: "#FBBF24",
  pot: "#3A3A40",
  potRim: "#55555E",
  potRimDark: "#2C2C33",
  stone: "#9B8B74",
  stoneDark: "#8A7A64",
  steam: "#CDBFA6",
  awningBronze: "#C4862A",
  awningTeal: "#2DD4BF",
  awningTealDark: "#1F9E8F",
  pole: "#A66E1C",
  produceRed: "#E0533B",
  produceOrange: "#F0A93A",
  produceGreen: "#7BA84F",
  basket: "#9C7338",
  basketDark: "#86643A",
  ripple: "#BFE0E2",
  canoe: "#6E4A22",
  canoeRim: "#CAA56F",
  paddle: "#9C7338",
  paddler: "#3A2A18",
  bird: "#7FB0BC",
  birdWing: "#5C97A4",
  cityA: "#33405A",
  cityB: "#283655",
  cityC: "#384668",
  cityD: "#2C3A5A",
  window: "#FFD98A",
} as const;

type SceneKind = "village" | "bushes" | "house" | "kitchen" | "market" | "creek" | "city";

/** Which scene to draw for each course type. Falls back to leafy bushes. */
const SCENE_FOR: Record<CourseType, SceneKind> = {
  first_words: "village",
  community: "village",
  sound_script: "bushes",
  songs: "bushes",
  colors: "bushes",
  grammar: "bushes",
  everyday_life: "house",
  house: "house",
  communicative: "kitchen",
  numbers_trade: "market",
  work: "market",
  oral_tradition: "creek",
  contemporary: "city",
  modern_life: "city",
};

/** Placement of each scene relative to its chapter label (fraction of width). */
const PLACEMENT: Record<SceneKind, { x: number; top: number; opacity: number }> = {
  village: { x: 0.04, top: 52, opacity: 0.92 },
  bushes: { x: 0.1, top: 60, opacity: 0.85 },
  house: { x: 0.26, top: 48, opacity: 0.92 },
  kitchen: { x: 0.08, top: 50, opacity: 0.92 },
  market: { x: 0.06, top: 48, opacity: 0.9 },
  creek: { x: 0, top: 40, opacity: 0.95 },
  city: { x: 0.16, top: 30, opacity: 0.7 },
};

// ── Individual scenes (authored at a local origin, faithful to the prototype) ──

function VillageScene(): ReactNode {
  return (
    <>
      <G>
        <Ellipse cx={40} cy={92} rx={62} ry={12} fill={SCENE.shadow} opacity={0.07} />
        <Rect x={12} y={48} width={56} height={44} rx={5} fill={SCENE.hutWall} />
        <Polygon points="40,4 78,52 2,52" fill="url(#roofG)" stroke={SCENE.roofStroke} strokeWidth={2} />
        <Rect x={33} y={64} width={14} height={28} rx={2} fill={SCENE.door} />
      </G>
      <G x={150} y={26}>
        <Ellipse cx={34} cy={78} rx={52} ry={10} fill={SCENE.shadow} opacity={0.07} />
        <Rect x={10} y={42} width={48} height={36} rx={5} fill={SCENE.hutWall2} />
        <Polygon points="34,6 68,46 0,46" fill="url(#roofG)" stroke={SCENE.roofStroke} strokeWidth={2} />
        <Rect x={27} y={56} width={13} height={22} rx={2} fill={SCENE.door} />
      </G>
      <G fill={SCENE.foliage} opacity={0.7}>
        <Path d="M104 110c6-14 10-14 12 0M122 116c5-12 9-12 11 0M250 118c6-13 10-13 12 0" />
      </G>
    </>
  );
}

function BushesScene(): ReactNode {
  return (
    <>
      <Rect x={46} y={18} width={7} height={70} rx={3} fill={SCENE.trunk} />
      <G fill={SCENE.foliage}>
        <Path d="M49 24 q-34 -10 -46 6 q24 6 46 4Z" />
        <Path d="M50 24 q34 -10 46 6 q-24 6 -46 4Z" />
        <Path d="M49 20 q-20 -22 -34 -22 q10 22 34 26Z" />
        <Path d="M50 20 q20 -22 34 -22 q-10 22 -34 26Z" />
      </G>
      <Ellipse cx={18} cy={86} rx={18} ry={11} fill={SCENE.foliageMid} opacity={0.85} />
      <Ellipse cx={86} cy={88} rx={20} ry={12} fill={SCENE.foliage} opacity={0.8} />
    </>
  );
}

function HouseScene(): ReactNode {
  return (
    <>
      <Ellipse cx={60} cy={150} rx={92} ry={14} fill={SCENE.shadow} opacity={0.07} />
      <Rect x={14} y={92} width={8} height={46} fill={SCENE.post} />
      <Rect x={98} y={92} width={8} height={46} fill={SCENE.post} />
      <Rect x={46} y={98} width={8} height={40} fill={SCENE.postLight} />
      <Rect x={70} y={98} width={8} height={40} fill={SCENE.postLight} />
      <Path d="M0 138 H120" stroke={SCENE.waterline} strokeWidth={3} opacity={0.7} />
      <Rect x={6} y={54} width={108} height={46} rx={5} fill={SCENE.hutWall3} />
      <Rect x={6} y={54} width={108} height={46} rx={5} fill="none" stroke={SCENE.hutStroke} strokeWidth={2} />
      <Polygon points="60,8 126,56 -6,56" fill="url(#roofG)" stroke={SCENE.roofStroke} strokeWidth={2} />
      <Rect x={20} y={70} width={20} height={30} rx={2} fill={SCENE.door} />
      <Rect x={78} y={68} width={20} height={18} rx={2} fill={SCENE.shutter} />
      <Rect x={52} y={70} width={16} height={30} rx={2} fill={SCENE.door} />
    </>
  );
}

function KitchenScene(): ReactNode {
  return (
    <>
      <Circle cx={48} cy={86} r={64} fill="url(#fireglow)" />
      <Ellipse cx={48} cy={118} rx={60} ry={11} fill={SCENE.shadow} opacity={0.08} />
      <Path d="M48 96 C36 84 40 70 48 60 C56 70 60 84 48 96Z" fill={SCENE.fireOuter} />
      <Path d="M48 92 C42 84 44 76 48 70 C52 76 54 84 48 92Z" fill={SCENE.fireInner} />
      <Path d="M18 86 q30 26 60 0 l-6 30 q-24 16 -48 0Z" fill={SCENE.pot} />
      <Ellipse cx={48} cy={86} rx={32} ry={9} fill={SCENE.potRim} />
      <Ellipse cx={48} cy={86} rx={22} ry={5} fill={SCENE.potRimDark} />
      <Ellipse cx={20} cy={116} rx={9} ry={6} fill={SCENE.stone} />
      <Ellipse cx={48} cy={120} rx={9} ry={6} fill={SCENE.stoneDark} />
      <Ellipse cx={76} cy={116} rx={9} ry={6} fill={SCENE.stone} />
      <Path
        d="M40 56 q-8-10 0-20 M56 56 q8-10 0-20"
        stroke={SCENE.steam}
        strokeWidth={3}
        fill="none"
        opacity={0.7}
        strokeLinecap="round"
      />
    </>
  );
}

function MarketScene(): ReactNode {
  return (
    <>
      <Ellipse cx={150} cy={156} rx={150} ry={14} fill={SCENE.shadow} opacity={0.06} />
      <G y={40}>
        <Rect x={6} y={40} width={84} height={70} rx={4} fill={SCENE.hutWall} />
        <Path d="M0 40 h96 l-10 -22 h-76Z" fill={SCENE.awningBronze} />
        <G fill={SCENE.pole}>
          <Rect x={14} y={18} width={10} height={22} />
          <Rect x={38} y={18} width={10} height={22} />
          <Rect x={62} y={18} width={10} height={22} />
        </G>
        <Circle cx={30} cy={64} r={7} fill={SCENE.produceRed} />
        <Circle cx={48} cy={64} r={7} fill={SCENE.produceOrange} />
        <Circle cx={66} cy={64} r={7} fill={SCENE.produceGreen} />
      </G>
      <G x={170} y={28}>
        <Rect x={6} y={52} width={92} height={78} rx={4} fill={SCENE.hutWall2} />
        <Path d="M0 52 h104 l-12 -24 h-80Z" fill={SCENE.awningTeal} />
        <G fill={SCENE.awningTealDark}>
          <Rect x={16} y={28} width={10} height={24} />
          <Rect x={44} y={28} width={10} height={24} />
          <Rect x={72} y={28} width={10} height={24} />
        </G>
        <Path d="M22 96 q14 18 28 0Z" fill={SCENE.basket} />
        <Path d="M58 96 q14 18 28 0Z" fill={SCENE.basketDark} />
      </G>
    </>
  );
}

function CreekScene({ width }: { width: number }): ReactNode {
  const q = width * 0.25;
  const h = width * 0.5;
  return (
    <>
      <Path d={`M0 24 q${q} 16 ${h} 0 t${h} 0 V132 H0Z`} fill="url(#riverG)" />
      <G stroke={SCENE.ripple} strokeWidth={3} opacity={0.4} strokeLinecap="round" fill="none" strokeDasharray="14 26">
        <Path d={`M${width * 0.1} 56 q${width * 0.14} -12 ${width * 0.28} 0 t${width * 0.28} 0`} />
        <Path d={`M${width * 0.16} 86 q${width * 0.14} -12 ${width * 0.28} 0 t${width * 0.28} 0`} />
      </G>
      <G fill={SCENE.foliageDark} opacity={0.92}>
        <Circle cx={18} cy={18} r={22} />
        <Circle cx={width - 18} cy={14} r={26} />
      </G>
      <G fill={SCENE.foliageMid} opacity={0.85}>
        <Circle cx={40} cy={22} r={15} />
        <Circle cx={width - 42} cy={18} r={17} />
      </G>
      <G x={width * 0.42} y={66}>
        <Ellipse cx={40} cy={30} rx={58} ry={13} fill={SCENE.shadow} opacity={0.22} />
        <Path d="M-14 22 q54 26 108 0 q-10 16 -54 16 q-44 0 -54 -16Z" fill={SCENE.canoe} />
        <Path d="M-6 22 q46 18 92 0" fill="none" stroke={SCENE.canoeRim} strokeWidth={3} />
        <Rect x={36} y={-20} width={6} height={42} rx={3} fill={SCENE.postLight} />
        <Path d="M39 -22 q14 6 12 22 q-12 -2 -12 -10Z" fill={SCENE.paddle} />
        <Circle cx={39} cy={2} r={7} fill={SCENE.paddler} />
      </G>
    </>
  );
}

function CityScene(): ReactNode {
  return (
    <>
      <Rect x={0} y={40} width={34} height={86} rx={3} fill={SCENE.cityA} />
      <Rect x={44} y={14} width={40} height={112} rx={3} fill={SCENE.cityB} />
      <Rect x={94} y={54} width={30} height={72} rx={3} fill={SCENE.cityC} />
      <Rect x={134} y={28} width={44} height={98} rx={3} fill={SCENE.cityD} />
      <Rect x={188} y={60} width={32} height={66} rx={3} fill={SCENE.cityA} />
      <G fill={SCENE.window} opacity={0.9}>
        <Rect x={8} y={52} width={6} height={6} />
        <Rect x={20} y={64} width={6} height={6} />
        <Rect x={54} y={28} width={6} height={6} />
        <Rect x={66} y={46} width={6} height={6} />
        <Rect x={148} y={42} width={6} height={6} />
        <Rect x={160} y={60} width={6} height={6} />
        <Rect x={102} y={68} width={6} height={6} />
        <Rect x={196} y={74} width={6} height={6} />
      </G>
    </>
  );
}

function renderScene(kind: SceneKind, width: number): ReactNode {
  switch (kind) {
    case "village":
      return <VillageScene />;
    case "house":
      return <HouseScene />;
    case "kitchen":
      return <KitchenScene />;
    case "market":
      return <MarketScene />;
    case "creek":
      return <CreekScene width={width} />;
    case "city":
      return <CityScene />;
    default:
      return <BushesScene />;
  }
}

interface JourneySceneryProps {
  areas: JourneyArea[];
  width: number;
  height: number;
}

/**
 * The illustrated world the journey path winds through. Renders one themed
 * scene per chapter, positioned just below its cartouche so the parchment floor
 * comes alive without competing with the bronze path and lesson discs on top.
 */
export function JourneyScenery({ areas, width, height }: JourneySceneryProps) {
  return (
    <Svg
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id="roofG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E0B97E" />
          <Stop offset="1" stopColor="#B98A4E" />
        </LinearGradient>
        <LinearGradient id="riverG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5C97A4" />
          <Stop offset="1" stopColor="#244C58" />
        </LinearGradient>
        <RadialGradient id="fireglow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FF9A3C" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#FF9A3C" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {areas.map((area) => {
        const kind = (area.courseType && SCENE_FOR[area.courseType]) || "bushes";
        const place = PLACEMENT[kind];
        return (
          <G
            key={area.courseId}
            x={width * place.x}
            y={area.y + place.top}
            opacity={place.opacity}
          >
            {renderScene(kind, width)}
          </G>
        );
      })}
    </Svg>
  );
}
