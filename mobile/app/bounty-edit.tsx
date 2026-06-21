import { IconSymbol } from "@/components/ui/icon-symbol";
import { NotificationBanner } from "@/components/notifications/notification-banner";
import { ALL_CATEGORIES, CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import {
  useBounty,
  useBountySubmissions,
  useUpdateBounty,
  type BountySubmission,
} from "@/lib/hooks/use-bounties";
import { useReviewContribution } from "@/lib/hooks/use-contributions";
import { canManageBounties, useCurrentUser } from "@/lib/hooks/use-current-user";
import { useToast } from "@/lib/hooks/use-toast";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function inputCls(extra?: string) {
  return `rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white ${extra ?? ""}`;
}

const SUBMISSION_STATUS: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  approved: { label: "Approved", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

type ReviewAction = (id: string, action: "approve" | "reject") => void;

function SubmissionRow({
  item,
  canReview,
  busy,
  onAction,
}: {
  item: BountySubmission;
  canReview: boolean;
  busy: boolean;
  onAction: ReviewAction;
}) {
  const M = useMuseumTheme();
  const status = SUBMISSION_STATUS[item.status] ?? { label: item.status, cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" };
  const actionable = canReview && item.status === "submitted";

  return (
    <View className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800">
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-white" numberOfLines={1}>
            {item.word} → {item.english}
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400" numberOfLines={1}>
            {item.submitterName ?? "Unknown"} · {item.type}
          </Text>
        </View>
        <View className={`rounded-full px-2 py-0.5 ${status.cls}`}>
          <Text className="text-[11px] font-semibold">{status.label}</Text>
        </View>
      </View>
      {actionable ? (
        <View className="mt-2.5 flex-row gap-2">
          <Pressable
            onPress={() => onAction(item.id, "reject")}
            disabled={busy}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 active:opacity-70 dark:border-red-900/50"
          >
            <IconSymbol name="xmark.circle.fill" size={14} color={M.error} />
            <Text className="text-xs font-semibold text-red-600 dark:text-red-400">Reject</Text>
          </Pressable>
          <Pressable
            onPress={() => onAction(item.id, "approve")}
            disabled={busy}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg bg-green-500 py-2 active:opacity-80"
          >
            <IconSymbol name="checkmark.circle.fill" size={14} color="#fff" />
            <Text className="text-xs font-semibold text-white">Approve</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function SubmissionGroup({
  title,
  items,
  empty,
  canReview,
  busy,
  onAction,
}: {
  title: string;
  items: BountySubmission[];
  empty: string;
  canReview: boolean;
  busy: boolean;
  onAction: ReviewAction;
}) {
  return (
    <>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {title} ({items.length})
      </Text>
      {items.length > 0 ? (
        <View className="gap-2">
          {items.map((s) => (
            <SubmissionRow key={s.id} item={s} canReview={canReview} busy={busy} onAction={onAction} />
          ))}
        </View>
      ) : (
        <Text className="text-sm text-neutral-400">{empty}</Text>
      )}
    </>
  );
}

function BountySubmissionsSection({ id, canReview }: { id: string; canReview: boolean }) {
  const { data, isLoading } = useBountySubmissions(id);
  const review = useReviewContribution();

  const handleAction: ReviewAction = (contributionId, action) => {
    const verb = action === "approve" ? "Approve" : "Reject";
    Alert.alert(
      `${verb} submission?`,
      action === "approve"
        ? "This credits the contributor and counts toward the bounty."
        : "This rejects the entry and notifies the contributor.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: verb,
          style: action === "reject" ? "destructive" : "default",
          onPress: () =>
            review.mutate(
              { id: contributionId, action },
              {
                onError: () =>
                  Alert.alert("Error", `Failed to ${action} submission. Please try again.`),
              }
            ),
        },
      ]
    );
  };

  return (
    <View className="mt-8">
      <Text className="mb-1 text-base font-bold text-neutral-900 dark:text-white">Submissions</Text>
      <Text className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
        Pending entries that match this bounty, plus those already credited to it.
      </Text>
      {isLoading ? (
        <ActivityIndicator className="my-4" />
      ) : (
        <>
          <SubmissionGroup
            title="Pending review"
            items={data?.pending ?? []}
            empty="No pending submissions."
            canReview={canReview}
            busy={review.isPending}
            onAction={handleAction}
          />
          <View className="h-5" />
          <SubmissionGroup
            title="Credited"
            items={data?.credited ?? []}
            empty="None credited yet."
            canReview={false}
            busy={false}
            onAction={handleAction}
          />
        </>
      )}
    </View>
  );
}

export default function BountyEditScreen() {
  const M = useMuseumTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: bounty, isLoading } = useBounty(id ?? "");
  const updateBounty = useUpdateBounty();
  const { toast, success: toastSuccess, error: toastError, dismiss: dismissToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [targetCount, setTargetCount] = useState("");
  const [xpReward, setXpReward] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "cancelled">("active");

  useEffect(() => {
    if (bounty) {
      setTitle(bounty.title);
      setDescription(bounty.description);
      setCategory(bounty.category);
      setTargetCount(String(bounty.targetCount));
      setXpReward(String(bounty.xpReward));
      setExpiresAt(bounty.expiresAt ? bounty.expiresAt.slice(0, 10) : "");
      setStatus(bounty.status as "active" | "completed" | "cancelled");
    }
  }, [bounty]);

  if (currentUser && !canManageBounties(currentUser)) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Bounty" }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900" edges={[]}>
          <IconSymbol name="lock.fill" size={40} color={M.error} />
          <Text className="mt-4 text-base font-semibold text-neutral-500">Admin access required</Text>
        </SafeAreaView>
      </>
    );
  }

  if (isLoading || !bounty) {
    return (
      <>
        <Stack.Screen options={{ title: "Edit Bounty" }} />
        <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-900" edges={[]}>
          <ActivityIndicator />
        </SafeAreaView>
      </>
    );
  }

  const canSubmit =
    title.trim() &&
    description.trim() &&
    parseInt(targetCount) > 0 &&
    parseInt(xpReward) > 0;

  const handleSave = async () => {
    if (!canSubmit || !id) return;

    try {
      await updateBounty.mutateAsync({
        id,
        title: title.trim(),
        description: description.trim(),
        targetCount: parseInt(targetCount),
        xpReward: parseInt(xpReward),
        status,
        expiresAt: expiresAt.trim() ? new Date(expiresAt.trim()).toISOString() : null,
      });
      toastSuccess("Bounty updated!", `"${title.trim()}" has been saved.`);
      setTimeout(() => router.back(), 1500);
    } catch {
      toastError("Error", "Failed to update bounty. Please try again.");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Edit Bounty", headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <NotificationBanner
          visible={toast.visible}
          title={toast.title}
          body={toast.body}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="px-5 pb-10 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Status */}
            <Field label="Status" required>
              <View className="flex-row gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setStatus(opt.value)}
                    className={`flex-1 items-center rounded-xl py-3 ${
                      status === opt.value ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        status === opt.value ? "text-white" : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Title */}
            <Field label="Title" required>
              <TextInput
                className={inputCls()}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={M.muted}
                maxLength={300}
              />
            </Field>

            {/* Description */}
            <Field label="Description" required>
              <TextInput
                className={inputCls("min-h-[80px]")}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={M.muted}
                maxLength={1000}
              />
            </Field>

            {/* Category (read-only display) */}
            <Field label="Category">
              <View className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                <Text className="text-base text-neutral-500 dark:text-neutral-400">
                  {bounty.category
                    ? (CATEGORY_LABELS[bounty.category as DictionaryCategory] ?? bounty.category)
                    : "Any"}
                </Text>
              </View>
            </Field>

            {/* Target count + XP row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Target Count" required>
                  <TextInput
                    className={inputCls()}
                    value={targetCount}
                    onChangeText={setTargetCount}
                    keyboardType="number-pad"
                    placeholderTextColor={M.muted}
                  />
                </Field>
              </View>
              <View className="flex-1">
                <Field label="XP Bonus / Entry" required>
                  <TextInput
                    className={inputCls()}
                    value={xpReward}
                    onChangeText={setXpReward}
                    keyboardType="number-pad"
                    placeholderTextColor={M.muted}
                  />
                </Field>
              </View>
            </View>

            {/* Expires at */}
            <Field label="Expires At (optional)">
              <TextInput
                className={inputCls()}
                value={expiresAt}
                onChangeText={setExpiresAt}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={M.muted}
                maxLength={10}
              />
            </Field>

            {/* Save */}
            <Pressable
              onPress={handleSave}
              disabled={!canSubmit || updateBounty.isPending}
              className={`mt-2 items-center rounded-2xl py-4 ${
                canSubmit && !updateBounty.isPending
                  ? "bg-amber-500 active:opacity-80"
                  : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  canSubmit && !updateBounty.isPending ? "text-white" : "text-neutral-400"
                }`}
              >
                {updateBounty.isPending ? "Saving…" : "Save Changes"}
              </Text>
            </Pressable>

            {/* Submissions */}
            {id ? (
              <BountySubmissionsSection id={id} canReview={!!currentUser?.isAdmin} />
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
