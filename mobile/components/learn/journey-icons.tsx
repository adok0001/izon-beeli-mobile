import Svg, { Path, Rect } from "react-native-svg";
import type { NodeStatus } from "@/lib/journey";

/**
 * The glyph inside a journey disc — check (done), play (active), play in bronze
 * (open / unlocked), lock (locked).
 */
export function NodeGlyph({ status }: { status: NodeStatus }) {
  if (status === "done") {
    return (
      <Svg viewBox="0 0 24 24" width={26} height={26} fill="none">
        <Path
          d="M20 6 9 17l-5-5"
          stroke="#fff"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (status === "active") {
    return (
      <Svg viewBox="0 0 24 24" width={26} height={26}>
        <Path d="M8 5v14l11-7z" fill="#fff" />
      </Svg>
    );
  }
  if (status === "open") {
    return (
      <Svg viewBox="0 0 24 24" width={24} height={24}>
        <Path d="M8 5v14l11-7z" fill="#fff" fillOpacity={0.92} />
      </Svg>
    );
  }
  return (
    <Svg viewBox="0 0 24 24" width={24} height={24} fill="none">
      <Rect x={4} y={11} width={16} height={9} rx={2} stroke="#A89880" strokeWidth={2.2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#A89880" strokeWidth={2.2} />
    </Svg>
  );
}

/** Small bronze pennant that flies above the active node. */
export function ActiveFlag() {
  return (
    <Svg viewBox="0 0 24 24" width={22} height={22}>
      <Path d="M6 3v18" stroke="#A66E1C" strokeWidth={2} strokeLinecap="round" />
      <Path d="M6 4h11l-2.5 3.5L17 11H6z" fill="#D89A3A" stroke="#A66E1C" strokeWidth={1} />
    </Svg>
  );
}
