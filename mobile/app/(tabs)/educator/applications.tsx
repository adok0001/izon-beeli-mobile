import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { useStudioAccess } from "@/components/studio/studio-gate";
import { getAccent, type AccentHue } from "@/constants/accent-colors";
import { friendlyError } from "@/lib/api";
import { canReviewApplications } from "@/lib/hooks/use-current-user";
import {
  useReviewApplication,
  useReviewerApplications,
  type ApplicationStatus,
  type ReviewerApplication,
} from "@/lib/hooks/use-educator-panel";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Redirect, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Filter = ApplicationStatus | "all";
type Action = "approve" | "reject";

const ROLE_HUE: Record<ReviewerApplication["role"], AccentHue> = {
  teacher: "blue",
  professor: "purple",
  elder: "teal",
};

// ── Approve / reject modal ────────────────────────────────────────────────────

function ActionModal({
  app,
  action,
  busy,
  onConfirm,
  onClose,
}: Readonly<{
  app: ReviewerApplication;
  action: Action;
  busy: boolean;
  onConfirm: (note: string, grantLanguages: string[]) => void;
  onClose: () => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [langs, setLangs] = useState(app.languages.join(", "));
  const isApprove = action === "approve";
  const accent = isApprove ? M.success : M.error;

  const inputStyle = {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: M.inputBorder,
    backgroundColor: M.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: M.text,
  } as const;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={{
              backgroundColor: M.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 32,
              borderTopWidth: 1,
              borderColor: M.border,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: M.text }}>
              {isApprove ? t("admin.applications.approveTitle") : t("admin.applications.rejectTitle")}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
              {app.userName ?? app.userEmail} — {app.role}
            </Text>

            {isApprove && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: M.muted }}>
                  {t("admin.applications.grantLanguages")}
                </Text>
                <TextInput
                  value={langs}
                  onChangeText={setLangs}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="izon, igbo"
                  placeholderTextColor={M.muted}
                  style={inputStyle}
                />
              </View>
            )}

            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: M.muted }}>
                {t("admin.applications.noteLabel")}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                placeholder={isApprove ? t("admin.applications.approvePlaceholder") : t("admin.applications.rejectPlaceholder")}
                placeholderTextColor={M.muted}
                style={{ ...inputStyle, minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <Pressable
                onPress={onClose}
                style={{ flex: 1, borderRadius: 12, paddingVertical: 13, backgroundColor: M.pillBg, alignItems: "center" }}
                className="active:opacity-70"
              >
                <Text style={{ fontWeight: "700", color: M.sub }}>{t("admin.applications.cancel")}</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() =>
                  onConfirm(
                    note.trim(),
                    langs.split(",").map((l) => l.trim().toLowerCase()).filter(Boolean),
                  )
                }
                style={{ flex: 1, borderRadius: 12, paddingVertical: 13, backgroundColor: accent, alignItems: "center", opacity: busy ? 0.5 : 1 }}
                className="active:opacity-80"
              >
                <Text style={{ fontWeight: "800", color: "#fff" }}>
                  {busy
                    ? t("admin.applications.saving")
                    : isApprove
                      ? t("admin.applications.approve")
                      : t("admin.applications.reject")}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Application card ───────────────────────────────────────────────────────────

function ApplicationCard({
  app,
  busy,
  onAction,
}: Readonly<{
  app: ReviewerApplication;
  busy: boolean;
  onAction: (action: Action) => void;
}>) {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const roleAccent = getAccent(ROLE_HUE[app.role] ?? "blue");
  const statusColor =
    app.status === "approved" ? M.success : app.status === "rejected" ? M.error : M.warning;
  const statusBg =
    app.status === "approved" ? M.successBg : app.status === "rejected" ? M.errorBg : M.warningBg;
  const statusLabel = t(
    app.status === "approved"
      ? "admin.applications.statusApproved"
      : app.status === "rejected"
        ? "admin.applications.statusRejected"
        : "admin.applications.statusPending",
  );

  return (
    <View
      style={{
        marginHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: M.border,
        backgroundColor: M.card,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: M.text }}>
            {app.userName ?? "—"}
          </Text>
          {app.userEmail ? (
            <Text style={{ marginTop: 1, fontSize: 12, color: M.muted }}>{app.userEmail}</Text>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: roleAccent.bg }}>
              <Text style={{ fontSize: 10, fontWeight: "800", textTransform: "capitalize", color: roleAccent.solid }}>
                {app.role}
              </Text>
            </View>
            <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: statusBg }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: statusColor }}>{statusLabel}</Text>
            </View>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: M.muted }}>
          {new Date(app.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {app.languages.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {app.languages.map((l) => (
            <View key={l} style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: M.pillBg }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: M.sub }}>{l}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={() => setExpanded((x) => !x)} hitSlop={6} style={{ marginTop: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: M.accent }}>
          {expanded ? t("admin.applications.hideDetails") : t("admin.applications.showDetails")}
        </Text>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 10, gap: 12 }}>
          <Detail label={t("admin.applications.labelBackground")} value={app.background} />
          <Detail label={t("admin.applications.labelReason")} value={app.reason} />
          {app.reviewerNote ? (
            <Detail label={t("admin.applications.labelReviewerNote")} value={app.reviewerNote} italic />
          ) : null}
        </View>
      )}

      {app.status === "pending" && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <Pressable
            disabled={busy}
            onPress={() => onAction("approve")}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 11, backgroundColor: M.successBg, opacity: busy ? 0.5 : 1 }}
            className="active:opacity-70"
          >
            <IconSymbol name="checkmark.circle.fill" size={16} color={M.success} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: M.success }}>
              {t("admin.applications.approve")}
            </Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => onAction("reject")}
            style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 11, backgroundColor: M.errorBg, opacity: busy ? 0.5 : 1 }}
            className="active:opacity-70"
          >
            <IconSymbol name="xmark.circle.fill" size={16} color={M.error} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: M.error }}>
              {t("admin.applications.reject")}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Detail({ label, value, italic }: Readonly<{ label: string; value: string; italic?: boolean }>) {
  const M = useMuseumTheme();
  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: M.muted, marginBottom: 3 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, lineHeight: 19, color: M.sub, fontStyle: italic ? "italic" : "normal" }}>
        {value}
      </Text>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function ReviewerApplicationsScreen() {
  const M = useMuseumTheme();
  const { t } = useTranslation();
  const { user, canAccess } = useStudioAccess();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();
  const [filter, setFilter] = useState<Filter>("pending");
  const [modal, setModal] = useState<{ app: ReviewerApplication; action: Action } | null>(null);

  // The educator gate admits any reviewer; approving applications is elder/admin
  // only, so re-gate here and bounce teachers/professors back to the hub.
  const allowed = canReviewApplications(user);
  const { data: apps = [], isLoading } = useReviewerApplications(canAccess && allowed);
  const review = useReviewApplication();

  const counts = useMemo(
    () => ({
      pending: apps.filter((a) => a.status === "pending").length,
      approved: apps.filter((a) => a.status === "approved").length,
      rejected: apps.filter((a) => a.status === "rejected").length,
    }),
    [apps],
  );
  const visible = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  if (!allowed) return <Redirect href="/(tabs)/educator" />;

  const filters: { key: Filter; label: string; count?: number }[] = [
    { key: "pending", label: t("admin.applications.statusPending"), count: counts.pending },
    { key: "approved", label: t("admin.applications.statusApproved"), count: counts.approved },
    { key: "rejected", label: t("admin.applications.statusRejected"), count: counts.rejected },
    { key: "all", label: t("admin.applications.filterAll") },
  ];

  const confirm = (note: string, grantLanguages: string[]) => {
    if (!modal) return;
    review.mutate(
      {
        id: modal.app.id,
        status: modal.action === "approve" ? "approved" : "rejected",
        reviewerNote: note,
        grantLanguages,
      },
      {
        onSuccess: () => {
          setModal(null);
          toastSuccess(
            modal.action === "approve"
              ? t("admin.applications.approveTitle")
              : t("admin.applications.rejectTitle"),
          );
        },
        onError: (err) => toastError(t("admin.applications.saving"), friendlyError(err)),
      },
    );
  };

  const listHeader = (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: M.text }}>
        {t("admin.applications.title")}
      </Text>
      <Text style={{ marginTop: 4, fontSize: 13, color: M.sub }}>
        {t("admin.applications.subtitle")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {filters.map(({ key, label, count }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={{
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 7,
                backgroundColor: active ? M.text : M.pillBg,
              }}
              className="active:opacity-70"
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.card : M.sub }}>
                {label}
                {count ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const listEmpty = (
    <View style={{ alignItems: "center", paddingVertical: 56, paddingHorizontal: 24 }}>
      {isLoading ? (
        <Text style={{ fontSize: 14, color: M.muted }}>{t("common.loading")}</Text>
      ) : (
        <>
          <IconSymbol name="checkmark.seal.fill" size={34} color={M.border} />
          <Text style={{ marginTop: 12, fontSize: 14, textAlign: "center", color: M.muted }}>
            {filter === "all"
              ? t("admin.applications.emptyAll")
              : t("admin.applications.emptyFiltered", {
                  status: filters.find((f) => f.key === filter)?.label.toLowerCase() ?? filter,
                })}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: t("admin.nav.applications"), headerBackTitle: "Back" }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["top"]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ApplicationCard
              app={item}
              busy={review.isPending}
              onAction={(action) => setModal({ app: item, action })}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
      {modal && (
        <ActionModal
          app={modal.app}
          action={modal.action}
          busy={review.isPending}
          onConfirm={confirm}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
