import { IconSymbol } from "@/components/ui/icon-symbol";
import { ALL_CATEGORIES, CATEGORY_LABELS, type DictionaryCategory } from "@/lib/dictionary";
import { useCreateBounty, type CreateBountyInput } from "@/lib/hooks/use-bounties";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { ACTIVE_LANGUAGES } from "@/lib/mock-data";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
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

const CONTRIBUTION_TYPES = [
  { value: undefined, label: "Any" },
  { value: "word", label: "Word" },
  { value: "phrase", label: "Phrase" },
  { value: "audio", label: "Audio" },
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

function input(extra?: string) {
  return `rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white ${extra ?? ""}`;
}

export default function BountyCreateScreen() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const createBounty = useCreateBounty();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [contributionType, setContributionType] = useState<
    "word" | "phrase" | "audio" | undefined
  >(undefined);
  const [targetCount, setTargetCount] = useState("20");
  const [xpReward, setXpReward] = useState("25");
  const [expiresAt, setExpiresAt] = useState("");

  // Guard: non-admins should never reach this screen
  if (currentUser && !currentUser.isAdmin) {
    return (
      <>
        <Stack.Screen options={{ title: "Create Bounty" }} />
        <SafeAreaView
          className="flex-1 items-center justify-center bg-white dark:bg-neutral-900"
          edges={[]}
        >
          <IconSymbol name="lock.fill" size={40} color="#ef4444" />
          <Text className="mt-4 text-base font-semibold text-neutral-500">
            Admin access required
          </Text>
        </SafeAreaView>
      </>
    );
  }

  const canSubmit =
    title.trim() &&
    description.trim() &&
    languageId &&
    parseInt(targetCount) > 0 &&
    parseInt(xpReward) > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;

    const input: CreateBountyInput = {
      title: title.trim(),
      description: description.trim(),
      languageId: languageId!,
      targetCount: parseInt(targetCount),
      xpReward: parseInt(xpReward),
      ...(category ? { category } : {}),
      ...(contributionType ? { contributionType } : {}),
      ...(expiresAt.trim() ? { expiresAt: new Date(expiresAt.trim()).toISOString() } : {}),
    };

    try {
      await createBounty.mutateAsync(input);
      Alert.alert("Bounty created!", `"${input.title}" is now live.`, [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to create bounty. Please try again.");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Create Bounty", headerBackTitle: "Back" }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={[]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="px-5 pb-10 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Field label="Title" required>
              <TextInput
                className={input()}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Izon Food & Cooking Vocabulary"
                placeholderTextColor="#9ca3af"
                maxLength={300}
              />
            </Field>

            {/* Description */}
            <Field label="Description" required>
              <TextInput
                className={input("min-h-[80px]")}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what contributors should submit…"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={1000}
              />
            </Field>

            {/* Language */}
            <Field label="Language" required>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {ACTIVE_LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.id}
                    onPress={() => setLanguageId(lang.id)}
                    className={`rounded-full px-4 py-2 ${
                      languageId === lang.id
                        ? "bg-blue-500"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        languageId === lang.id
                          ? "text-white"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {lang.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Field>

            {/* Category */}
            <Field label="Category">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                <Pressable
                  onPress={() => setCategory(null)}
                  className={`rounded-full px-4 py-2 ${
                    category === null
                      ? "bg-blue-500"
                      : "bg-neutral-100 dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      category === null
                        ? "text-white"
                        : "text-neutral-600 dark:text-neutral-400"
                    }`}
                  >
                    Any
                  </Text>
                </Pressable>
                {ALL_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`rounded-full px-4 py-2 ${
                      category === cat
                        ? "bg-blue-500"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        category === cat
                          ? "text-white"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {CATEGORY_LABELS[cat as DictionaryCategory] ?? cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Field>

            {/* Contribution type */}
            <Field label="Contribution Type">
              <View className="flex-row gap-2">
                {CONTRIBUTION_TYPES.map((ct) => (
                  <Pressable
                    key={String(ct.value)}
                    onPress={() => setContributionType(ct.value)}
                    className={`flex-1 items-center rounded-xl py-3 ${
                      contributionType === ct.value
                        ? "bg-blue-500"
                        : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        contributionType === ct.value
                          ? "text-white"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {ct.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            {/* Target count + XP row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Target Count" required>
                  <TextInput
                    className={input()}
                    value={targetCount}
                    onChangeText={setTargetCount}
                    keyboardType="number-pad"
                    placeholder="20"
                    placeholderTextColor="#9ca3af"
                  />
                </Field>
              </View>
              <View className="flex-1">
                <Field label="XP Bonus / Entry" required>
                  <TextInput
                    className={input()}
                    value={xpReward}
                    onChangeText={setXpReward}
                    keyboardType="number-pad"
                    placeholder="25"
                    placeholderTextColor="#9ca3af"
                  />
                </Field>
              </View>
            </View>

            {/* Expires at */}
            <Field label="Expires At (optional)">
              <TextInput
                className={input()}
                value={expiresAt}
                onChangeText={setExpiresAt}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                maxLength={10}
              />
            </Field>

            {/* Submit */}
            <Pressable
              onPress={handleCreate}
              disabled={!canSubmit || createBounty.isPending}
              className={`mt-2 items-center rounded-2xl py-4 ${
                canSubmit && !createBounty.isPending
                  ? "bg-amber-500 active:opacity-80"
                  : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  canSubmit && !createBounty.isPending
                    ? "text-white"
                    : "text-neutral-400"
                }`}
              >
                {createBounty.isPending ? "Creating…" : "Create Bounty"}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
