import { analytics } from "@/lib/analytics";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LanguagePicker } from "@/components/ui/language-picker";
import { OptionCard } from "@/components/ui/option-card";
import { getAccent } from "@/constants/accent-colors";
import { ONBOARDING_KEY } from "@/lib/constants";
import { useCompleteOnboarding } from "@/lib/hooks/use-current-user";
import { ACTIVE_LANGUAGES } from "@/lib/mock-data";
import { requestPushPermissionAndRegister } from "@/lib/push-notifications";
import { MOBILE_TOUR_REGISTRY, type TourFeature } from "@/lib/tours/mobile-tour-registry";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useLevelStore } from "@/store/level-store";
import type { UserLevel } from "@/types";
import { useAuth } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TOTAL_STEPS = 6;
const BEELI_START = 2;
const BEELI_END = 4;
const BEELI_FEATURES: readonly TourFeature[] = MOBILE_TOUR_REGISTRY.welcome.features;
const DEFAULT_LANG_ID = "izon";
const DEFAULT_LEVEL: UserLevel = "new";

const LEVEL_OPTIONS: { id: UserLevel; icon: string; labelKey: string; detailKey: string }[] = [
  { id: "new", icon: "leaf.fill", labelKey: "onboarding.levelNew", detailKey: "onboarding.levelNewDetail" },
  { id: "some_words", icon: "book.fill", labelKey: "onboarding.levelSomeWords", detailKey: "onboarding.levelSomeWordsDetail" },
  { id: "comfortable", icon: "bubble.left.fill", labelKey: "onboarding.levelComfortable", detailKey: "onboarding.levelComfortableDetail" },
];

// ── Shared atoms ─────────────────────────────────────────────────────────────

function StepHeading({ title, subtitle }: Readonly<{ title: string; subtitle: string }>) {
  const M = useMuseumTheme();
  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
      <Text style={{ fontSize: 28, fontWeight: "900", color: M.text, letterSpacing: -0.5 }}>{title}</Text>
      <Text style={{ marginTop: 8, fontSize: 15, color: M.sub }}>{subtitle}</Text>
    </View>
  );
}

function EdgeButton({
  side,
  onPress,
  disabled,
  accessibilityLabel,
  children,
}: Readonly<{
  side: "left" | "right";
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  children: ReactNode;
}>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="active:opacity-70"
      style={{
        position: "absolute",
        [side]: 16,
        top: "50%",
        marginTop: -28,
        height: 56,
        width: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: M.card,
        borderWidth: 1,
        borderColor: M.border,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </Pressable>
  );
}

function EdgeAdvanceButton({
  isLast,
  disabled,
  loading,
  onPress,
}: Readonly<{ isLast: boolean; disabled: boolean; loading: boolean; onPress: () => void }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={isLast ? t("onboarding.letsGo") : t("onboarding.continue")}
      className="active:opacity-80"
      style={{
        position: "absolute",
        right: 16,
        top: "50%",
        marginTop: -28,
        minWidth: 56,
        height: 56,
        borderRadius: 28,
        paddingHorizontal: isLast ? 20 : 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: M.accent,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={M.ink} />
      ) : isLast ? (
        <Text style={{ fontSize: 15, fontWeight: "700", color: M.ink }}>{t("onboarding.letsGo")}</Text>
      ) : (
        <IconSymbol name="chevron.right" size={20} color={M.ink} />
      )}
    </Pressable>
  );
}

/** Placeholder phone-frame mock — swap each card's icon block for a real screenshot asset. */
function BeeliScreenshotPlaceholder({ icon }: Readonly<{ icon: string }>) {
  const M = useMuseumTheme();
  return (
    <View
      style={{
        width: 216,
        height: 384,
        borderRadius: 32,
        borderWidth: 6,
        borderColor: M.border,
        backgroundColor: M.card,
        padding: 16,
        overflow: "hidden",
      }}
    >
      <View style={{ height: 10, width: "40%", borderRadius: 5, backgroundColor: M.border }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            height: 88,
            width: 88,
            borderRadius: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: M.accentGlow,
            marginBottom: 20,
          }}
        >
          <IconSymbol name={icon as never} size={40} color={M.accent} />
        </View>
        <View style={{ height: 10, width: "70%", borderRadius: 5, backgroundColor: M.border, marginBottom: 10 }} />
        <View style={{ height: 10, width: "50%", borderRadius: 5, backgroundColor: M.border }} />
      </View>
    </View>
  );
}

// ── Steps ────────────────────────────────────────────────────────────────────

function LanguageStep({
  selectedLangId,
  onSelect,
  onApplyContributor,
}: Readonly<{ selectedLangId: string; onSelect: (id: string) => void; onApplyContributor: () => void }>) {
  const { t } = useTranslation();
  return (
    <>
      <StepHeading title={t("onboarding.welcome")} subtitle={t("onboarding.whichLanguage")} />
      <LanguagePicker value={selectedLangId} onSelect={onSelect} languages={ACTIVE_LANGUAGES} />
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 }}>
        <Pressable
          onPress={onApplyContributor}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: getAccent("teal").solid,
            paddingVertical: 14,
          }}
          className="active:opacity-80"
        >
          <IconSymbol name="person.badge.plus" size={18} color={getAccent("teal").solid} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: getAccent("teal").solid }}>
            {t("onboarding.applyContributor")}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function LevelStep({
  selectedLevel,
  onSelect,
}: Readonly<{ selectedLevel: UserLevel | null; onSelect: (level: UserLevel) => void }>) {
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never) as string;
  return (
    <>
      <StepHeading title={t("onboarding.chooseLevelTitle")} subtitle={t("onboarding.chooseLevelSubtitle")} />
      <View style={{ flex: 1, paddingHorizontal: 24, gap: 12 }}>
        {LEVEL_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.id}
            icon={opt.icon}
            label={tr(opt.labelKey)}
            detail={tr(opt.detailKey)}
            selected={opt.id === selectedLevel}
            onPress={() => onSelect(opt.id)}
          />
        ))}
      </View>
    </>
  );
}

function BeeliStep({ feature }: Readonly<{ feature: TourFeature }>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const tr = (key: string) => t(key as never) as string;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <BeeliScreenshotPlaceholder icon={feature.icon} />
      <Text
        style={{ marginTop: 28, fontSize: 24, fontWeight: "900", color: M.text, textAlign: "center", letterSpacing: -0.5 }}
      >
        {tr(feature.titleKey)}
      </Text>
      <Text style={{ marginTop: 10, fontSize: 15, color: M.sub, textAlign: "center", lineHeight: 22, maxWidth: 320 }}>
        {tr(feature.detailKey)}
      </Text>
    </View>
  );
}

function RemindersStep() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <View
        style={{
          height: 96,
          width: 96,
          borderRadius: 48,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: M.accentGlow,
          marginBottom: 24,
        }}
      >
        <IconSymbol name="bell.fill" size={44} color={M.accent} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: "900", color: M.text, textAlign: "center", letterSpacing: -0.5 }}>
        {t("onboarding.remindersTitle")}
      </Text>
      <Text style={{ marginTop: 12, fontSize: 15, color: M.sub, textAlign: "center", lineHeight: 24 }}>
        {t("onboarding.remindersSubtitle")}
      </Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { getToken } = useAuth();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const setLevel = useLevelStore((s) => s.setLevel);
  const { mutateAsync: completeOnboardingAsync } = useCompleteOnboarding();
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [selectedLangId, setSelectedLangId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<UserLevel | null>(null);
  const [finishing, setFinishing] = useState(false);

  const isLast = step === TOTAL_STEPS - 1;
  const canAdvance = step === 0 ? selectedLangId !== "" : step === 1 ? selectedLevel !== null : true;

  const finalize = useCallback(
    async (lang: string, level: UserLevel, requestPush: boolean) => {
      setFinishing(true);
      setLanguage(lang);
      setLevel(level);
      // Push permission + the backend sync don't depend on each other — run them
      // concurrently instead of making the (possibly interactive) OS prompt block
      // the PATCH that actually persists onboarding completion. allSettled so a
      // failure on either never blocks navigating away (best-effort finish).
      const pushTask: Promise<void> = requestPush
        ? getToken().then(async (token) => {
            if (token) await requestPushPermissionAndRegister(token);
          })
        : Promise.resolve();
      await Promise.allSettled([pushTask, completeOnboardingAsync({ selectedLanguageId: lang, level })]);
      AsyncStorage.setItem(ONBOARDING_KEY, "1").catch(() => {});
      analytics.onboardingCompleted(lang, level);
      router.replace("/(tabs)/learn");
    },
    [getToken, router, setLanguage, setLevel, completeOnboardingAsync]
  );

  const goNext = () => {
    if (finishing || !canAdvance) return;
    if (isLast) {
      finalize(selectedLangId, selectedLevel!, true);
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    if (finishing) return;
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSkip = () => {
    if (finishing) return;
    finalize(selectedLangId || DEFAULT_LANG_ID, selectedLevel ?? DEFAULT_LEVEL, false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingTop: 16, gap: 16 }}>
        <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{ height: 6, flex: 1, borderRadius: 999, backgroundColor: i <= step ? M.accent : M.border }}
            />
          ))}
        </View>
        <Pressable
          onPress={handleSkip}
          disabled={finishing}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("onboarding.skip")}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: M.muted }}>{t("onboarding.skip")}</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {step === 0 && (
          <LanguageStep
            selectedLangId={selectedLangId}
            onSelect={setSelectedLangId}
            onApplyContributor={() => router.push("/reviewer-application")}
          />
        )}
        {step === 1 && <LevelStep selectedLevel={selectedLevel} onSelect={setSelectedLevel} />}
        {step >= BEELI_START && step <= BEELI_END && <BeeliStep feature={BEELI_FEATURES[step - BEELI_START]} />}
        {step === TOTAL_STEPS - 1 && <RemindersStep />}
      </View>

      {step > 0 && (
        <EdgeButton side="left" onPress={goBack} disabled={finishing} accessibilityLabel={t("onboarding.back")}>
          <IconSymbol name="chevron.left" size={20} color={M.text} />
        </EdgeButton>
      )}
      <EdgeAdvanceButton isLast={isLast} disabled={!canAdvance || finishing} loading={finishing} onPress={goNext} />
    </SafeAreaView>
  );
}
