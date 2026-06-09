import { IconSymbol } from "@/components/ui/icon-symbol";
import { getAccent } from "@/constants/accent-colors";
import { hapticTap } from "@/lib/haptics";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface ActivityDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
  tag?: string;
}

const ACTIVITIES: { section: string; items: ActivityDef[] }[] = [
  {
    section: "QUICK PLAY",
    items: [
      { id: "speed-round", title: "Speed Round", description: "Answer as many words as you can in 60 seconds", icon: "bolt.fill", color: getAccent("amber").solid, route: "/speed-round" },
      { id: "recall-bingo", title: "Recall Bingo", description: "Mark the called word on your 5×5 card", icon: "square.grid.3x3.fill", color: getAccent("green").solid, route: "/recall-bingo" },
    ],
  },
  {
    section: "LISTENING",
    items: [
      { id: "dictation", title: "Dictation Drop", description: "Hear a phrase, type what you heard", icon: "waveform", color: getAccent("sky").solid, route: "/dictation" },
      { id: "say-it-back", title: "Say It Back", description: "Listen, record, and compare your pronunciation", icon: "mic.fill", color: getAccent("rose").solid, route: "/say-it-back" },
    ],
  },
  {
    section: "READING & WRITING",
    items: [
      { id: "fill-proverb", title: "Fill the Proverb", description: "Complete a proverb by choosing the missing word", icon: "text.quote", color: getAccent("purple").solid, route: "/fill-proverb" },
      { id: "sentence-builder", title: "Build a Sentence", description: "Arrange scrambled word tiles into a correct sentence", icon: "text.alignleft", color: getAccent("orange").solid, route: "/sentence-builder" },
    ],
  },
  {
    section: "SCRIPTS",
    items: [
      { id: "script-decode", title: "Script Decode", description: "Read a Ge'ez or Nsịbịdị symbol and identify it", icon: "character.book.closed", color: getAccent("teal").solid, route: "/script-decode" },
      { id: "trace-symbol", title: "Trace the Symbol", description: "Trace Ge'ez, Nsịbịdị, or Adinkra by hand", icon: "pencil.tip", color: getAccent("amber").solid, route: "/trace-symbol" },
    ],
  },
  {
    section: "EXPLORE",
    items: [
      { id: "etymology-trail", title: "Etymology Trail", description: "Trace how words evolved across centuries", icon: "clock.arrow.circlepath", color: getAccent("sky").solid, route: "/etymology-trail" },
      { id: "word-challenge", title: "Word Challenge", description: "Learn, record, and write with today's word", icon: "pencil.and.scribble", color: getAccent("rose").solid, route: "/word-challenge", tag: "DAILY" },
    ],
  },
];

function SectionHeader({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: M.accent }} />
        <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2.5, color: M.muted }}>{label}</Text>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: M.accent }} />
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: M.border }} />
    </View>
  );
}

function ActivityCard({ activity }: { activity: ActivityDef }) {
  const M = useMuseumTheme();
  const router = useRouter();

  const handlePress = () => {
    hapticTap();
    router.push(activity.route as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flex: 1,
        borderRadius: 16,
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        padding: 14,
        minHeight: 110,
        overflow: "hidden",
      }}
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={activity.title}
      accessibilityHint={activity.description}
    >
      {/* Tag */}
      {activity.tag && (
        <View style={{ position: "absolute", top: 10, right: 10, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: `${activity.color}25` }}>
          <Text style={{ fontSize: 7, fontWeight: "800", letterSpacing: 1, color: activity.color }}>{activity.tag}</Text>
        </View>
      )}

      {/* Icon */}
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: `${activity.color}18`, marginBottom: 10 }}>
        <IconSymbol name={activity.icon as any} size={20} color={activity.color} />
      </View>

      {/* Text */}
      <Text style={{ fontSize: 13, fontWeight: "800", color: M.text, marginBottom: 3 }}>{activity.title}</Text>
      <Text style={{ fontSize: 11, color: M.muted, lineHeight: 15 }} numberOfLines={2}>{activity.description}</Text>

      {/* Bottom color accent */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: `${activity.color}40` }} />
    </Pressable>
  );
}

export function ActivityGrid() {
  return (
    <View>
      {ACTIVITIES.map((section) => (
        <View key={section.section}>
          <SectionHeader label={section.section} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            {section.items.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
