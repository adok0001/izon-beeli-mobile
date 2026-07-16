import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

function formatRuntime(mins: number): string {
  if (mins <= 0) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** One of the translucent stat chips in the hero. */
function Pill({ children }: Readonly<{ children: string }>) {
  const M = useMuseumTheme();
  return (
    <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(7,8,15,0.4)", borderWidth: 1, borderColor: "rgba(247,242,232,0.2)" }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: M.parchment }}>{children}</Text>
    </View>
  );
}

/**
 * The gradient hero for a season/story-arc. Pure props, so both the live
 * Series screen and the Studio season preview render it identically.
 */
export function SeasonHero({
  title,
  nativeTitle,
  logline,
  icon,
  gradientTop,
  episodeCount,
  totalMinutes,
  levelCount,
  castCount,
  allComingSoon,
}: Readonly<{
  title: string;
  nativeTitle?: string | null;
  logline?: string | null;
  icon: IconSymbolName;
  gradientTop: string;
  episodeCount: number;
  totalMinutes: number;
  levelCount: number;
  castCount: number;
  allComingSoon: boolean;
}>) {
  const M = useMuseumTheme();
  return (
    <LinearGradient colors={[gradientTop, M.ink]} style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 22, overflow: "hidden" }}>
      <IconSymbol name={icon} size={84} color={M.parchment} style={{ position: "absolute", top: 8, right: 10, opacity: 0.16 }} />
      <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", color: M.accent }}>
        Audio Drama Series
      </Text>
      <Text style={{ marginTop: 6, fontSize: 30, fontWeight: "800", color: M.parchment }}>{nativeTitle ?? title}</Text>
      {nativeTitle ? <Text style={{ marginTop: 2, fontSize: 15, fontWeight: "600", color: M.textDim }}>{title}</Text> : null}
      {logline ? <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 20, color: M.textDim }}>{logline}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        <Pill>
          {`${episodeCount} episode${episodeCount === 1 ? "" : "s"}${totalMinutes > 0 ? `  ·  ${formatRuntime(totalMinutes)}` : ""}`}
        </Pill>
        {levelCount > 0 ? <Pill>{`${levelCount} level${levelCount === 1 ? "" : "s"}`}</Pill> : null}
        {castCount > 0 ? <Pill>{`${castCount} cast`}</Pill> : null}
        {allComingSoon ? <Pill>Coming soon</Pill> : null}
      </View>
    </LinearGradient>
  );
}
