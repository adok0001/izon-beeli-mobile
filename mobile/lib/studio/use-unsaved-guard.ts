import { useNavigation } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert } from "react-native";

/**
 * Intercept navigation away from an editor while it has unsaved edits.
 *
 * Covers both the custom back chevron (which calls `router.back()` → a GO_BACK
 * action) and the native swipe / hardware back, via React Navigation's
 * `beforeRemove` event. Shows a Discard / Keep-editing confirm; Discard replays
 * the original navigation action so the user still leaves.
 *
 * `dirty` is read through a ref so toggling it doesn't re-subscribe the listener.
 */
export function useUnsavedGuard(
  dirty: boolean,
  opts?: Readonly<{ title?: string; message?: string; discardLabel?: string; keepLabel?: string }>,
) {
  const navigation = useNavigation();
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  const title = opts?.title ?? "Discard changes?";
  const message = opts?.message ?? "You have unsaved changes. Leave without saving?";
  const discardLabel = opts?.discardLabel ?? "Discard";
  const keepLabel = opts?.keepLabel ?? "Keep editing";

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      Alert.alert(title, message, [
        { text: keepLabel, style: "cancel" },
        { text: discardLabel, style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsubscribe;
  }, [navigation, title, message, discardLabel, keepLabel]);
}
