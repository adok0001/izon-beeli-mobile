import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useCreateGroup, useJoinGroupByCode } from "@/lib/hooks/use-classroom";
import { useLanguageStore } from "@/store/language-store";
import { getLanguageName } from "@/lib/mock-data";

export default function CreateGroupScreen() {
  const router = useRouter();
  const { selectedLanguageId } = useLanguageStore();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroupByCode();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createGroup.mutate(
      { name: name.trim(), languageId: selectedLanguageId },
      {
        onSuccess: (group) => router.replace(`/classroom/${group.id}`),
        onError: (err) => Alert.alert("Error", err.message),
      }
    );
  };

  const handleJoin = () => {
    if (inviteCode.length < 6) return;
    joinGroup.mutate(inviteCode.trim(), {
      onSuccess: (group) => router.replace(`/classroom/${group.id}`),
      onError: () => setError("No group found with that invite code."),
    });
  };

  const isPending = createGroup.isPending || joinGroup.isPending;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <Pressable onPress={() => router.back()}>
            <Text className="text-base text-neutral-500">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {mode === "create" ? "New Group" : "Join Group"}
          </Text>
          <View className="w-14" />
        </View>

        <View className="flex-1 px-5 pt-6">
          {/* Mode toggle */}
          <View className="mb-6 flex-row gap-2">
            <Pressable
              onPress={() => { setMode("create"); setError(""); }}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                mode === "create" ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text className={`text-sm font-semibold ${
                mode === "create" ? "text-white" : "text-neutral-600 dark:text-neutral-400"
              }`}>
                Create
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { setMode("join"); setError(""); }}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                mode === "join" ? "bg-blue-500" : "bg-neutral-100 dark:bg-neutral-800"
              }`}
            >
              <Text className={`text-sm font-semibold ${
                mode === "join" ? "text-white" : "text-neutral-600 dark:text-neutral-400"
              }`}>
                Join
              </Text>
            </Pressable>
          </View>

          {mode === "create" ? (
            <>
              <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Group Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Izon Language Club"
                placeholderTextColor="#9ca3af"
                className="mb-4 rounded-xl bg-neutral-100 px-4 py-3 text-base text-neutral-900 dark:bg-neutral-800 dark:text-white"
                autoFocus
              />
              <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
                Language: {getLanguageName(selectedLanguageId)}
              </Text>
              <Pressable
                onPress={handleCreate}
                disabled={!name.trim() || isPending}
                className={`items-center rounded-xl py-4 ${
                  name.trim() && !isPending ? "bg-blue-500 active:opacity-80" : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              >
                <Text className={`text-base font-semibold ${
                  name.trim() && !isPending ? "text-white" : "text-neutral-400"
                }`}>
                  {isPending ? "Creating..." : "Create Group"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Invite Code
              </Text>
              <TextInput
                value={inviteCode}
                onChangeText={(t) => { setInviteCode(t.toUpperCase()); setError(""); }}
                placeholder="Enter 6-character code"
                placeholderTextColor="#9ca3af"
                className="mb-2 rounded-xl bg-neutral-100 px-4 py-3 text-center text-xl font-mono tracking-widest text-neutral-900 dark:bg-neutral-800 dark:text-white"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
              {error ? (
                <Text className="mb-4 text-sm text-red-500">{error}</Text>
              ) : null}
              <Pressable
                onPress={handleJoin}
                disabled={inviteCode.length < 6 || isPending}
                className={`mt-2 items-center rounded-xl py-4 ${
                  inviteCode.length >= 6 && !isPending ? "bg-blue-500 active:opacity-80" : "bg-neutral-200 dark:bg-neutral-700"
                }`}
              >
                <Text className={`text-base font-semibold ${
                  inviteCode.length >= 6 && !isPending ? "text-white" : "text-neutral-400"
                }`}>
                  {isPending ? "Joining..." : "Join Group"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
