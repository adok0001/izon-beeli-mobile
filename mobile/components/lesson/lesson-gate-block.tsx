import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { Checkpoint } from "@/lib/checkpoints";
import { tWithVars } from "@/lib/i18n-dynamic";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";

/**
 * Shown in place of a lesson that sits behind an uncleared gate.
 *
 * This is a *stop*, not a redirect. Auto-navigating away from a gated lesson
 * bounced against the checkpoint screen's own "continue" navigation and looped
 * forever whenever the gate data was momentarily stale; a screen the learner
 * taps out of can't loop.
 *
 * The two gate kinds read differently on purpose: a warm-up invites, a
 * checkpoint asks the learner to prove something.
 */
export function LessonGateBlock({ gate }: { gate: Checkpoint }) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const isIntro = gate.kind === "intro";

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        backgroundColor: M.bg,
      }}
    >
      {/* Diamond, matching the gate's shape on the journey map. */}
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 20,
          transform: [{ rotate: "45deg" }],
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: M.accentGlow,
          borderWidth: 1.5,
          borderColor: M.accentBorder,
        }}
      >
        <View style={{ transform: [{ rotate: "-45deg" }] }}>
          <IconSymbol name={isIntro ? "sparkles" : "lock.fill"} size={26} color={M.accent} />
        </View>
      </View>

      <Text
        style={{
          marginTop: 20,
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: M.accent,
        }}
      >
        {isIntro ? t("checkpoint.introEyebrow") : t("checkpoint.gateEyebrow")}
      </Text>

      <Text style={{ marginTop: 8, fontSize: 19, fontWeight: "800", color: M.text, textAlign: "center" }}>
        {isIntro
          ? t("checkpoint.introTitle")
          : tWithVars(t, "checkpoint.nodeLabel", { n: gate.ordinal })}
      </Text>

      <Text style={{ marginTop: 10, fontSize: 14, lineHeight: 20, color: M.sub, textAlign: "center" }}>
        {isIntro ? t("checkpoint.introBody") : t("checkpoint.sheetBody")}
      </Text>

      <Pressable
        onPress={() => router.replace({ pathname: "/checkpoint/[id]", params: { id: gate.id } })}
        style={{ marginTop: 28, borderRadius: 16, overflow: "hidden", alignSelf: "stretch" }}
        className="active:opacity-80"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[MUSEUM.accentLight, MUSEUM.accentDark]}
          style={{ paddingVertical: 16, alignItems: "center" }}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: M.parchment }}>
            {isIntro ? t("checkpoint.introStart") : t("checkpoint.start")} ›
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
