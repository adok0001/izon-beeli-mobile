import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { getLanguageName } from "@/lib/mock-data";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { Segment, Step } from "./types";

interface WizardSummary {
  languageId: string | null;
  title: string;
  segments: Segment[];
}

type SummaryChipsProps = Readonly<{
  languageId: string;
  title: string;
  filledSegmentCount: number;
}>;

function SummaryChips({ languageId, title, filledSegmentCount }: SummaryChipsProps) {
  const { t } = useTranslation();

  return (
    <View className="mb-3 flex-row flex-wrap gap-2">
      <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
        <Text className="text-xs text-neutral-600 dark:text-neutral-400">
          {getLanguageName(languageId)}
        </Text>
      </View>
      <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
        <Text className="text-xs text-neutral-600 dark:text-neutral-400">
          {title || t("contribute.untitled")}
        </Text>
      </View>
      <View className="rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-800">
        <Text className="text-xs text-neutral-600 dark:text-neutral-400">
          {t("contribute.segmentsCount", { count: filledSegmentCount })}
        </Text>
      </View>
    </View>
  );
}

type WizardNavBarProps = Readonly<{
  step: Step;
  currentIndex: number;
  canGoNext: boolean;
  isSubmitting: boolean;
  summary: WizardSummary;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
}>;

export function WizardNavBar({
  step,
  currentIndex,
  canGoNext,
  isSubmitting,
  summary,
  onNext,
  onBack,
  onSubmit,
}: WizardNavBarProps) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const filledSegments = summary.segments.filter((s) => s.text.trim());
  const canSubmit = !isSubmitting && filledSegments.length > 0;

  return (
    <View className="border-t border-neutral-100 px-5 py-4 dark:border-neutral-800">
      {/* Summary chips */}
      {step === "transcript" && summary.languageId && (
        <SummaryChips
          languageId={summary.languageId}
          title={summary.title}
          filledSegmentCount={filledSegments.length}
        />
      )}

      <View className="flex-row gap-3">
        {currentIndex > 0 && (
          <Pressable
            onPress={onBack}
            className="flex-row items-center justify-center rounded-2xl bg-neutral-100 px-5 py-3.5 active:opacity-80 dark:bg-neutral-800"
          >
            <IconSymbol name="chevron.left" size={14} color={M.sub} />
            <Text className="ml-1 font-semibold text-neutral-700 dark:text-neutral-300">
              {t("common.back")}
            </Text>
          </Pressable>
        )}
        {step !== "transcript" ? (
          <Pressable
            onPress={onNext}
            disabled={!canGoNext}
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80 ${
              canGoNext ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-900"
            }`}
          >
            <Text className="font-semibold text-white">{t("common.continue")}</Text>
            <IconSymbol name="chevron.right" size={14} color="white" />
          </Pressable>
        ) : (
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-3.5 active:opacity-80 ${
              canSubmit ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-900"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={14} color="white" />
                <Text className="ml-2 font-semibold text-white">{t("contribute.submitLesson")}</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
