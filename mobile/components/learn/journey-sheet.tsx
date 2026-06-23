import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSkillMeta } from "@/constants/course-colors";
import { JOURNEY, type JourneyNode } from "@/lib/journey";
import { localize } from "@/lib/localize";
import { formatDuration } from "@/lib/mock-data";
import type { UiLanguage } from "@/store/ui-language-store";

interface MetaPillProps {
  label: string;
  color?: string;
  bg?: string;
  border?: string;
}

function MetaPill({
  label,
  color = JOURNEY.pillText,
  bg = JOURNEY.pillBg,
  border = JOURNEY.hairline,
}: MetaPillProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text style={{ fontSize: 11.5, fontWeight: "700", color }}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: JourneyNode["status"] }) {
  const { t } = useTranslation();
  if (status === "done") {
    return (
      <MetaPill
        label={`✓ ${t("journey.done", { defaultValue: "Completed" })}`}
        color={JOURNEY.success}
        bg="rgba(22,163,74,0.08)"
        border="rgba(22,163,74,0.35)"
      />
    );
  }
  if (status === "active") {
    return (
      <MetaPill
        label={`● ${t("journey.upNext", { defaultValue: "Up next" })}`}
        color={JOURNEY.bronze}
        bg="rgba(196,134,42,0.10)"
        border={JOURNEY.bronzeMid}
      />
    );
  }
  return <MetaPill label={`🔒 ${t("journey.locked", { defaultValue: "Locked" })}`} />;
}

interface JourneySheetProps {
  node: JourneyNode | null;
  areaName: string;
  uiLanguage: UiLanguage;
  onClose: () => void;
  onStart: (node: JourneyNode) => void;
}

export function JourneySheet({ node, areaName, uiLanguage, onClose, onStart }: JourneySheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const open = node !== null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(7,8,15,0.55)" }} onPress={onClose} />
      {node && (
        <View
          style={{
            backgroundColor: JOURNEY.sheetBg,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderTopWidth: 2,
            borderTopColor: "rgba(196,134,42,0.35)",
            paddingHorizontal: 22,
            paddingTop: 12,
            paddingBottom: 28 + insets.bottom,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: JOURNEY.hairline,
              marginBottom: 16,
            }}
          />

          <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.4, color: node.areaColor }}>
            {areaName.toUpperCase()}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 22, fontWeight: "800", color: JOURNEY.sheetTitle }}>
            {localize(node.title, uiLanguage)}
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: JOURNEY.sheetBody }}>
            {localize(node.description, uiLanguage)}
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <MetaPill
              label={t("journey.lessonN", {
                n: node.lessonNumber,
                defaultValue: `Lesson ${node.lessonNumber}`,
              })}
              color={JOURNEY.bronze}
            />
            {node.durationSeconds ? <MetaPill label={`⏱ ${formatDuration(node.durationSeconds)}`} /> : null}
            {node.skills.slice(0, 3).map((skill) => {
              const meta = getSkillMeta(skill);
              return <MetaPill key={skill} label={`${meta.icon} ${meta.label}`} />;
            })}
            <StatusPill status={node.status} />
          </View>

          {node.status !== "locked" ? (
            <>
              <View
                style={{
                  marginTop: 18,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: JOURNEY.trackEmpty,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: node.status === "done" ? "100%" : "5%",
                    borderRadius: 999,
                    backgroundColor: JOURNEY.bronze,
                  }}
                />
              </View>
              <Pressable
                onPress={() => onStart(node)}
                style={{ marginTop: 18, borderRadius: 16, overflow: "hidden" }}
                accessibilityRole="button"
              >
                {node.status === "active" ? (
                  <LinearGradient
                    colors={["#D89A3A", JOURNEY.bronze]}
                    style={{ paddingVertical: 16, alignItems: "center" }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
                      {t("journey.start", { defaultValue: "Start lesson" })} ›
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    style={{
                      paddingVertical: 16,
                      alignItems: "center",
                      backgroundColor: JOURNEY.sheetBg,
                      borderWidth: 1.5,
                      borderColor: JOURNEY.bronzeMid,
                      borderRadius: 16,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "800", color: JOURNEY.bronze }}>
                      {t("journey.review", { defaultValue: "Review lesson" })}
                    </Text>
                  </View>
                )}
              </Pressable>
            </>
          ) : (
            <View
              style={{
                marginTop: 18,
                borderRadius: 14,
                padding: 14,
                backgroundColor: JOURNEY.pillBg,
                borderWidth: 1,
                borderColor: JOURNEY.hairline,
              }}
            >
              <Text style={{ fontSize: 13, color: JOURNEY.capLocked, textAlign: "center" }}>
                {t("journey.lockedHint", {
                  defaultValue: "Finish the previous lessons to unlock this one",
                })}
              </Text>
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}
