import { FeedbackModal } from "@/components/feedback-modal";
import { SignInPrompt, useRequireAuth } from "@/components/sign-in-prompt";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AVATAR_PAGES, PROFILE_AVATARS, type ProfileAvatar } from "@/constants/profile-avatars";
import { getAccent } from "@/constants/accent-colors";
import { canAccessEducatorPanel, type DailyGoal, useCurrentUser, useUpdateDailyGoal, useUpdateProfileAvatar } from "@/lib/hooks/use-current-user";
import { analytics } from "@/lib/analytics";
import { useAppConfig } from "@/lib/hooks/use-app-config";
import { useProgressSummary } from "@/lib/hooks/use-progress";
import { getLevelInfo } from "@/lib/xp-levels";
import { useMuseumTheme, MUSEUM } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useProfileAvatarStore } from "@/store/profile-avatar-store";
import { useTourStore } from "@/store/tour-store";
import { useWelcomeChecklistStore } from "@/store/welcome-checklist-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Linking,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLanguageName } from "@/lib/mock-data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GOAL_OPTIONS: { id: DailyGoal; icon: string; labelKey: string; detailKey: string }[] = [
  { id: "casual",    icon: "leaf.fill",  labelKey: "onboarding.goalCasual",    detailKey: "onboarding.goalCasualDetail"    },
  { id: "steady",    icon: "flame.fill", labelKey: "onboarding.goalSteady",    detailKey: "onboarding.goalSteadyDetail"    },
  { id: "intensive", icon: "bolt.fill",  labelKey: "onboarding.goalIntensive", detailKey: "onboarding.goalIntensiveDetail" },
];

// ── Atoms ──────────────────────────────────────────────────────────────────

function AvatarCircle({ avatar, size, selected, onPress }: Readonly<{
  avatar: ProfileAvatar; size: number; selected?: boolean; onPress?: () => void;
}>) {
  const M = useMuseumTheme();
  const circle = (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      alignItems: "center", justifyContent: "center",
      backgroundColor: avatar.bg,
      borderWidth: selected ? 3 : 0,
      borderColor: selected ? M.accent : "transparent",
      shadowColor: avatar.bg, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: selected ? 0.6 : 0, shadowRadius: 10, elevation: selected ? 6 : 0,
    }}>
      <IconSymbol name={avatar.icon as any} size={size * 0.42} color={avatar.fg} />
    </View>
  );
  return onPress
    ? <Pressable onPress={onPress} className="active:opacity-80">{circle}</Pressable>
    : circle;
}

function HeroStat({ value, label }: Readonly<{ value: string; label: string }>) {
  const M = useMuseumTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "900", color: M.parchment }}>{value}</Text>
      <Text style={{ marginTop: 4, fontSize: 9, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: M.textDim }}>
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  const M = useMuseumTheme();
  return <View style={{ width: 1, backgroundColor: M.border, marginVertical: 12 }} />;
}


function SectionLabel({ label }: { label: string }) {
  const M = useMuseumTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 4 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: M.accent }} />
      <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", color: M.muted }}>
        {label}
      </Text>
    </View>
  );
}

function MenuRow({ icon, label, detail, onPress, danger }: Readonly<{
  icon: string; label: string; detail?: string; onPress: () => void; danger?: boolean;
}>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: M.border }}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}: ${detail}` : label}
      className="active:opacity-70"
    >
      <IconSymbol name={icon as any} size={18} color={danger ? "#f87171" : M.muted} />
      <Text style={{ marginLeft: 14, flex: 1, fontSize: 14, color: danger ? "#f87171" : M.text, fontWeight: danger ? "700" : "500" }}>
        {label}
      </Text>
      {!!detail && <Text style={{ marginRight: 8, fontSize: 12, color: M.muted }}>{detail}</Text>}
      {!danger && <IconSymbol name="chevron.right" size={14} color={M.muted} />}
    </Pressable>
  );
}

// ── Avatar picker ──────────────────────────────────────────────────────────

function AvatarGrid({ page, draft, onSelect, pageWidth }: Readonly<{
  page: ProfileAvatar[]; draft: string; onSelect: (id: string) => void; pageWidth: number;
}>) {
  return (
    <View style={{ width: pageWidth, paddingHorizontal: 16, paddingBottom: 4 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
        {page.map((av) => (
          <View key={av.id} style={{ alignItems: "center", gap: 6 }}>
            <AvatarCircle avatar={av} size={114} selected={draft === av.id} onPress={() => onSelect(av.id)} />
            <Text style={{ fontSize: 10, fontWeight: "600", color: "#9A9480", letterSpacing: 0.3 }}>{av.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AvatarPickerModal({ visible, current, onSave, onClose }: Readonly<{
  visible: boolean; current: string; onSave: (id: string) => void; onClose: () => void;
}>) {
  const M = useMuseumTheme();
  const [draft, setDraft] = useState(current);
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const MODAL_W = SCREEN_WIDTH - 48;

  useEffect(() => {
    if (visible) {
      setDraft(current);
      setActivePage(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [visible, current]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActivePage(Math.round(e.nativeEvent.contentOffset.x / MODAL_W));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: MODAL_W, backgroundColor: MUSEUM.ink, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#2E3245" }}>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18 }}>
            <Pressable onPress={onClose} style={{ position: "absolute", left: 20 }} className="active:opacity-70">
              <IconSymbol name="xmark" size={18} color={M.sub} />
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: "700", color: M.parchment }}>Profile Image</Text>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={{ width: MODAL_W }}
          >
            {AVATAR_PAGES.map((pg, i) => (
              <AvatarGrid key={i} page={pg} draft={draft} onSelect={setDraft} pageWidth={MODAL_W} />
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 14, paddingBottom: 4 }}>
            {AVATAR_PAGES.map((_, i) => (
              <View key={i} style={{ width: i === activePage ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === activePage ? M.accent : "#2E3245" }} />
            ))}
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
            <Pressable
              onPress={() => { onSave(draft); onClose(); }}
              style={{ height: 54, borderRadius: 27, backgroundColor: M.parchment, alignItems: "center", justifyContent: "center" }}
              className="active:opacity-80"
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: MUSEUM.ink }}>Save</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

// ── Goal picker ────────────────────────────────────────────────────────────

function GoalPickerModal({ visible, current, onClose, onChange }: Readonly<{
  visible: boolean; current: DailyGoal | null; onClose: () => void; onChange: (g: DailyGoal) => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }} onPress={onClose} />
      <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: M.ink, borderTopWidth: 1, borderTopColor: M.border, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: M.border, alignSelf: "center", marginBottom: 16 }} />
        <Text style={{ marginBottom: 20, textAlign: "center", fontSize: 17, fontWeight: "800", color: M.parchment }}>
          {t("profile.dailyGoal")}
        </Text>
        {GOAL_OPTIONS.map((opt) => {
          const selected = current === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => { onChange(opt.id); onClose(); }}
              style={{ marginBottom: 10, flexDirection: "row", alignItems: "center", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: selected ? 2 : 1, borderColor: selected ? M.accent : M.border, backgroundColor: selected ? `${M.accent}10` : M.card }}
              className="active:opacity-70"
            >
              <View style={{ marginRight: 14, width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: selected ? M.accent : M.border }}>
                <IconSymbol name={opt.icon as any} size={18} color={selected ? M.ink : M.sub} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: selected ? M.accent : M.text }}>{t(opt.labelKey as any)}</Text>
                <Text style={{ fontSize: 12, color: M.sub, marginTop: 2 }}>{t(opt.detailKey as any)}</Text>
              </View>
              {selected && <IconSymbol name="checkmark.circle.fill" size={20} color={M.accent} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const M = useMuseumTheme();
  const teal = getAccent("teal");
  const indigo = getAccent("indigo");
  const blue = getAccent("blue");
  const orange = getAccent("orange");
  const green = getAccent("green");
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { data: currentUser } = useCurrentUser();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const updateDailyGoal = useUpdateDailyGoal();
  const updateProfileAvatar = useUpdateProfileAvatar();
  const { data: summary } = useProgressSummary();
  const { data: config } = useAppConfig();
  const { selectedLanguageId } = useLanguageStore();
  const { t } = useTranslation();
  const showTour = useTourStore((s) => s.showTour);
  const resetChecklist = useWelcomeChecklistStore((s) => s.reset);
  const resetTours = useTourStore((s) => s.reset);
  const { selectedId: avatarId, hydrate: hydrateAvatar } = useProfileAvatarStore();
  const { requireAuth, descriptionKey, closePrompt } = useRequireAuth();

  useEffect(() => { hydrateAvatar(); }, [hydrateAvatar]);

  const isAdmin = currentUser?.isAdmin ?? false;
  const levelInfo = getLevelInfo(summary?.points ?? 0);
  const showPlusCta = config?.plusEnabled && currentUser?.planTier !== "plus" && levelInfo.level >= 5;
  const canAccessEducator = currentUser ? canAccessEducatorPanel(currentUser) : false;
  const reviewerRole = currentUser?.reviewerRole ?? null;
  const displayName = user?.username ?? "Learner";
  const completedCount = summary?.completedCount ?? 0;
  const avatar = PROFILE_AVATARS.find((a) => a.id === avatarId) ?? PROFILE_AVATARS[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: M.ink }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Page header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: M.parchment, letterSpacing: -0.5 }}>Me</Text>
          <Pressable onPress={() => router.push("/settings")} className="active:opacity-70">
            <IconSymbol name="gearshape.fill" size={22} color={M.textDim} />
          </Pressable>
        </View>

        {/* Hero identity card */}
        <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 20, borderWidth: 1, borderColor: M.border, backgroundColor: MUSEUM.inkRaised, overflow: "hidden" }}>
          <View style={{ alignItems: "center", paddingTop: 28, paddingHorizontal: 20 }}>

            {/* Avatar + edit badge */}
            <View style={{ width: 92, height: 92, marginBottom: 14 }}>
              <AvatarCircle avatar={avatar} size={92} />
              <Pressable
                onPress={() => setAvatarPickerVisible(true)}
                style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: MUSEUM.ink, borderWidth: 1.5, borderColor: M.border, alignItems: "center", justifyContent: "center" }}
                className="active:opacity-70"
                accessibilityLabel="Change profile image"
                accessibilityRole="button"
              >
                <IconSymbol name="pencil" size={12} color={M.textDim} />
              </Pressable>
            </View>

            {/* Name */}
            <Text style={{ fontSize: 20, fontWeight: "900", color: M.parchment, letterSpacing: -0.3 }}>{displayName}</Text>

            {/* Role badges */}
            {(isAdmin || reviewerRole) ? (
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {isAdmin && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: `${M.accent}20`, borderWidth: 1, borderColor: `${M.accent}40` }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: M.accent }}>ADMIN</Text>
                  </View>
                )}
                {reviewerRole === "elder" && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: teal.bg, borderWidth: 1, borderColor: teal.border }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: teal.solid }}>{t("reviewerApplication.roleElder").toUpperCase()}</Text>
                  </View>
                )}
                {reviewerRole === "professor" && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: indigo.bg, borderWidth: 1, borderColor: indigo.border }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: indigo.solid }}>{t("reviewerApplication.roleProfessor").toUpperCase()}</Text>
                  </View>
                )}
                {reviewerRole === "teacher" && (
                  <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: blue.bg, borderWidth: 1, borderColor: blue.border }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", letterSpacing: 1.5, color: blue.solid }}>{t("reviewerApplication.roleTeacher").toUpperCase()}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Level pill */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
              <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: M.accent }}>Lv {levelInfo.level}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: "600", color: M.textDim }}>{levelInfo.title}</Text>
            </View>

            {/* XP progress */}
            <View style={{ width: "100%", marginTop: 14, marginBottom: 20 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: M.border, overflow: "hidden" }}>
                <View style={{ height: "100%", borderRadius: 2, backgroundColor: M.accent, width: `${Math.round(levelInfo.progress * 100)}%` }} />
              </View>
              <Text style={{ marginTop: 5, fontSize: 9, fontWeight: "600", color: M.textDimDark, textAlign: "right" }}>
                {levelInfo.currentXP} / {levelInfo.xpForNextLevel} XP
              </Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ borderTopWidth: 1, borderTopColor: M.border, flexDirection: "row" }}>
            <HeroStat value={String(summary?.streak ?? 0)} label="Streak" />
            <StatDivider />
            <HeroStat value={String(completedCount)} label="Lessons" />
            <StatDivider />
            <HeroStat value={String(summary?.points ?? 0)} label="Total XP" />
          </View>
        </View>

        {/* Plus CTA */}
        {showPlusCta ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <Pressable
              onPress={() => { analytics.plusCtaTapped("profile"); router.push("/plus-paywall"); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 16, backgroundColor: indigo.bg, borderWidth: 1, borderColor: indigo.border, borderLeftWidth: 4, borderLeftColor: indigo.solid }}
              className="active:opacity-80"
            >
              <View style={{ width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: indigo.bg }}>
                <IconSymbol name="heart.fill" size={18} color={indigo.solid} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: indigo.solid }}>Support Beeli</Text>
                <Text style={{ marginTop: 2, fontSize: 11, color: M.sub, lineHeight: 15 }}>
                  You've reached {levelInfo.title}. Unlock Plus and keep us growing.
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={indigo.solid} />
            </Pressable>
          </View>
        ) : null}

        {/* Menu */}
        <View style={{ backgroundColor: M.card, paddingHorizontal: 20, paddingBottom: 8 }}>
          <SectionLabel label={t("settings.learning")} />
          <MenuRow icon="chart.bar.fill" label={t("profile.progressDashboard")} onPress={() => router.push("/dashboard")} />
          <MenuRow icon="book.fill" label={t("profile.learning")} detail={getLanguageName(selectedLanguageId)} onPress={() => router.push("/(tabs)/learn")} />
          <MenuRow
            icon="target"
            label={t("profile.dailyGoal")}
            detail={currentUser?.dailyGoal ? t(`onboarding.goal${currentUser.dailyGoal.charAt(0).toUpperCase()}${currentUser.dailyGoal.slice(1)}` as any) : undefined}
            onPress={() => setGoalPickerVisible(true)}
          />
          {currentUser?.isAdmin ? (
            <>
              <SectionLabel label="Admin" />
              <MenuRow icon="shield.fill" label={t("educator.panelTitle")} onPress={() => router.push("/(tabs)/educator")} />
              <MenuRow icon="gearshape.fill" label={t("educator.adminPanel")} onPress={() => router.push("/(tabs)/admin")} />
            </>
          ) : null}
          {!isAdmin && canAccessEducator ? (
            <>
              <SectionLabel label="Educator" />
              <MenuRow icon="shield.fill" label={t("educator.panelTitle")} onPress={() => router.push("/(tabs)/educator")} />
            </>
          ) : null}

          <SectionLabel label="Community" />
          {!isAdmin && !currentUser?.isReviewer && (
            <Pressable
              onPress={() => router.push("/reviewer-application")}
              style={{ marginBottom: 8, borderRadius: 14, borderWidth: 1, borderColor: green.border, borderLeftWidth: 4, borderLeftColor: green.solid, backgroundColor: green.bg, padding: 14, flexDirection: "row", alignItems: "center" }}
              accessibilityRole="button"
              accessibilityLabel={t("learn.contributorBannerTitle")}
              accessibilityHint="Tap to apply as a contributor"
              className="active:opacity-70"
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: green.bg, marginRight: 12 }}>
                <IconSymbol name="person.badge.plus" size={17} color={green.solid} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: green.solid }}>{t("learn.contributorBannerTitle")}</Text>
                <Text style={{ fontSize: 11, color: M.sub, marginTop: 1 }}>{t("learn.contributorBannerCta")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={14} color={green.solid} />
            </Pressable>
          )}
          {(isAdmin || currentUser?.isReviewer) && (
            <MenuRow icon="checkmark.shield.fill" label={t("profile.reviewContributions")} onPress={() => router.push("/review")} />
          )}
          <MenuRow
            icon="doc.text.fill"
            label={t("profile.myContributions")}
            onPress={() => requireAuth(() => router.push("/my-contributions"), "common.signInDictionaryDesc")}
          />
          <MenuRow icon="star.fill" label={t("profile.bounties")} onPress={() => router.push("/bounties")} />
          <MenuRow icon="trophy.fill" label={t("profile.contributors")} onPress={() => router.push("/contributors")} />
          <MenuRow icon="person.3.fill" label={t("profile.classroom")} onPress={() => router.push("/classroom")} />

          <SectionLabel label={t("settings.app")} />
          <MenuRow icon="exclamationmark.bubble" label={t("profile.sendFeedback")} onPress={() => setFeedbackVisible(true)} />
          <MenuRow icon="map.fill" label={t("profile.restartWelcomeTour")} onPress={async () => { await resetChecklist(); await resetTours(); showTour("welcome"); }} />
          <MenuRow icon="arrow.down.circle" label={t("profile.downloads")} onPress={() => router.push("/downloads")} />
          <MenuRow icon="gearshape.fill" label={t("profile.settings")} onPress={() => router.push("/settings")} />

          <SectionLabel label="Follow Us" />
          <MenuRow icon="camera.fill" label="Instagram" detail="@beeliapp" onPress={() => Linking.openURL("https://instagram.com/beeliapp")} />
          <MenuRow icon="play.rectangle.fill" label="TikTok" detail="@beeliapp" onPress={() => Linking.openURL("https://tiktok.com/@beeliapp")} />
          <MenuRow icon="at" label="X (Twitter)" detail="@beeliapp" onPress={() => Linking.openURL("https://x.com/beeliapp")} />

          <View style={{ marginTop: 20 }}>
            <MenuRow icon="xmark" label={t("profile.signOut")} onPress={() => { analytics.reset(); signOut(); }} danger />
          </View>
        </View>

        <View style={{ height: 40, backgroundColor: M.card }} />
      </ScrollView>

      <FeedbackModal visible={feedbackVisible} onClose={() => setFeedbackVisible(false)} />
      <SignInPrompt descriptionKey={descriptionKey} onClose={closePrompt} />
      <GoalPickerModal
        visible={goalPickerVisible}
        current={currentUser?.dailyGoal ?? null}
        onClose={() => setGoalPickerVisible(false)}
        onChange={(g) => updateDailyGoal.mutate(g)}
      />
      <AvatarPickerModal
        visible={avatarPickerVisible}
        current={avatarId}
        onSave={(id) => updateProfileAvatar.mutate(id)}
        onClose={() => setAvatarPickerVisible(false)}
      />
    </SafeAreaView>
  );
}
