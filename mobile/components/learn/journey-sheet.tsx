import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSkillMeta } from "@/constants/course-colors";
import { LessonProgram, type ProgramStep } from "@/components/lesson/lesson-program";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { isRemoteAudioSource } from "@/lib/downloads";
import { useLessonDownload } from "@/lib/hooks/use-lesson-download";
import type { JourneyNode } from "@/lib/journey";
import { localize } from "@/lib/localize";
import { MUSEUM, useMuseumTheme } from "@/lib/use-museum-theme";
import type { UiLanguage } from "@/store/ui-language-store";
import type { AudioSource } from "@/types";

/** The lesson plan shown on the course-review sheet. Each step deep-links to the
 *  same destination the lesson page uses, dismissing the sheet on the way. */
function buildProgramSteps(
  node: JourneyNode,
  router: ReturnType<typeof useRouter>,
  onClose: () => void
): ProgramStep[] {
  const go = (navigate: () => void) => () => {
    onClose();
    navigate();
  };
  const openLesson = go(() => router.push(`/lesson/${node.lessonId}`));
  return [
    ...(node.hasAudio ? [{ key: "stepListen" as const, onPress: openLesson }] : []),
    ...(node.hasTranscript
      ? [{ key: node.isSong ? ("stepStory" as const) : ("stepFlashcards" as const), onPress: openLesson }]
      : []),
    { key: "stepQuiz" as const, onPress: go(() => router.push({ pathname: "/quiz", params: { courseId: node.courseId, lessonId: node.lessonId } })) },
    { key: "stepReview" as const, onPress: go(() => router.push({ pathname: "/word-review", params: { lessonId: node.lessonId } })) },
    { key: "stepWriteReflection" as const, onPress: go(() => router.push("/journal" as any)) },
  ];
}

interface MetaPillProps {
  label: string;
  color?: string;
  bg?: string;
  border?: string;
}

function MetaPill({ label, color, bg, border }: MetaPillProps) {
  const M = useMuseumTheme();
  const resolved = { color: color ?? M.sub, bg: bg ?? M.pillBg, border: border ?? M.border };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: resolved.bg,
        borderWidth: 1,
        borderColor: resolved.border,
      }}
    >
      <Text style={{ fontSize: 11.5, fontWeight: "700", color: resolved.color }}>{label}</Text>
    </View>
  );
}

/** Download/downloaded/downloading control for offline lesson audio, gated behind Plus. */
function DownloadRow({
  node,
  areaName,
  remoteUrl,
}: {
  node: JourneyNode;
  areaName: string;
  remoteUrl: string;
}) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const { isDownloaded, isDownloading, onPress } = useLessonDownload({
    lessonId: node.lessonId,
    courseId: node.courseId,
    title: node.title,
    courseTitle: areaName,
    remoteUrl,
  });
  const tint = isDownloaded ? M.success : M.sub;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDownloading}
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 5,
        backgroundColor: isDownloaded ? M.successBg : M.pillBg,
        borderWidth: 1,
        borderColor: isDownloaded ? M.successBorder : M.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={isDownloaded ? t("downloads.removeDownload") : t("downloads.download")}
    >
      {isDownloading ? (
        <ActivityIndicator size="small" color={MUSEUM.accentDark} />
      ) : (
        <IconSymbol
          name={isDownloaded ? "checkmark.circle.fill" : "arrow.down.circle"}
          size={14}
          color={tint}
        />
      )}
      <Text style={{ fontSize: 11.5, fontWeight: "700", color: tint }}>
        {isDownloading
          ? t("downloads.downloading")
          : isDownloaded
            ? t("downloads.downloaded")
            : t("downloads.download")}
      </Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: JourneyNode["status"] }) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  if (status === "done") {
    return (
      <MetaPill
        label={`✓ ${t("journey.done", { defaultValue: "Completed" })}`}
        color={M.success}
        bg={M.successBg}
        border={M.successBorder}
      />
    );
  }
  if (status === "active") {
    return (
      <MetaPill
        label={`● ${t("journey.upNext", { defaultValue: "Up next" })}`}
        color={MUSEUM.accentDark}
        bg={M.accentGlow}
        border={M.accent}
      />
    );
  }
  if (status === "open") {
    return (
      <MetaPill
        label={`▷ ${t("journey.open", { defaultValue: "Open" })}`}
        color={MUSEUM.accentDark}
        bg="rgba(196,134,42,0.06)"
        border={M.accent}
      />
    );
  }
  return <MetaPill label={`🔒 ${t("journey.locked", { defaultValue: "Locked" })}`} />;
}

interface JourneySheetProps {
  node: JourneyNode | null;
  areaName: string;
  /** The selected lesson's raw audio source, for the download control — not part of JourneyNode's display-layout model. */
  audioUrl?: AudioSource;
  uiLanguage: UiLanguage;
  onClose: () => void;
  onStart: (node: JourneyNode) => void;
}

export function JourneySheet({ node, areaName, audioUrl, uiLanguage, onClose, onStart }: JourneySheetProps) {
  const { t } = useTranslation();
  const M = useMuseumTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const open = node !== null;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(7,8,15,0.55)" }} onPress={onClose} />
      {node && (
        <View
          style={{
            backgroundColor: M.card,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            borderTopWidth: 2,
            borderTopColor: M.accentBorder,
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
              backgroundColor: M.border,
              marginBottom: 16,
            }}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <Text style={{ fontSize: 13, lineHeight: 13, color: node.areaColor }}>●</Text>
            <Text style={{ fontSize: 11, fontWeight: "800", letterSpacing: 1.4, color: node.areaColor }}>
              {areaName.toUpperCase()}
            </Text>
          </View>
          <Text style={{ marginTop: 6, fontSize: 22, fontWeight: "800", color: M.text }}>
            {localize(node.title, uiLanguage)}
          </Text>
          <Text style={{ marginTop: 8, fontSize: 14, lineHeight: 20, color: M.sub }}>
            {localize(node.description, uiLanguage)}
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <MetaPill
              label={t("journey.lessonN", {
                n: node.lessonNumber,
                defaultValue: `Lesson ${node.lessonNumber}`,
              })}
              color={MUSEUM.accentDark}
            />
            {node.wordCount ? (
              <MetaPill
                label={`📖 ${t("journey.wordCount", {
                  count: node.wordCount,
                  defaultValue: `${node.wordCount} mots`,
                })}`}
              />
            ) : null}
            {node.skills.slice(0, 3).map((skill) => {
              const meta = getSkillMeta(skill);
              return <MetaPill key={skill} label={`${meta.icon} ${meta.label}`} />;
            })}
            <StatusPill status={node.status} />
            {isRemoteAudioSource(audioUrl) && node.status !== "locked" ? (
              <DownloadRow node={node} areaName={areaName} remoteUrl={audioUrl} />
            ) : null}
          </View>

          {node.status !== "locked" ? (
            <>
              <View
                style={{
                  marginTop: 18,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: M.border,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: node.status === "done" ? "100%" : "5%",
                    borderRadius: 999,
                    backgroundColor: MUSEUM.accentDark,
                  }}
                />
              </View>

              {/* Programme — the lesson plan, shown here before the learner taps
                  Start/Review. Each step deep-links like the lesson page did. */}
              <LessonProgram steps={buildProgramSteps(node, router, onClose)} accentColor={node.areaColor} paddingHorizontal={0} />

              <Pressable
                onPress={() => onStart(node)}
                style={{ marginTop: 18, borderRadius: 16, overflow: "hidden" }}
                accessibilityRole="button"
              >
                {node.status !== "done" ? (
                  <LinearGradient
                    colors={[MUSEUM.accentLight, MUSEUM.accentDark]}
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
                      backgroundColor: M.card,
                      borderWidth: 1.5,
                      borderColor: M.accent,
                      borderRadius: 16,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "800", color: MUSEUM.accentDark }}>
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
                backgroundColor: M.pillBg,
                borderWidth: 1,
                borderColor: M.border,
              }}
            >
              <Text style={{ fontSize: 13, color: M.muted, textAlign: "center" }}>
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
