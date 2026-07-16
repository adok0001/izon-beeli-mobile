import { useNavigation } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

/**
 * Intercept navigation away from an editor while it has unsaved edits.
 *
 * Covers both the custom back chevron (which calls `router.back()` → a GO_BACK
 * action) and the native swipe / hardware back. Shows a Discard / Keep-editing
 * confirm; Discard replays the original navigation action so the user still
 * leaves.
 *
 * Uses `usePreventRemove` (not a bare `beforeRemove` listener) because the
 * screens here run in a native-stack. A plain `e.preventDefault()` doesn't stop
 * the native pop — the screen is torn down natively but kept in JS state, so
 * "Keep editing" leaves a ghost screen alive in the background (its unsaved
 * edits reappear next time) and React Navigation logs the "removed natively but
 * didn't get removed from JS state" warning. `usePreventRemove` propagates the
 * prevention into react-native-screens so the native dismissal is blocked too,
 * keeping native and JS in sync.
 */
export function useUnsavedGuard(
  dirty: boolean,
  opts?: Readonly<{ title?: string; message?: string; discardLabel?: string; keepLabel?: string }>,
) {
  const navigation = useNavigation();

  usePreventRemove(dirty, ({ data }) => {
    confirmDiscardChanges(() => navigation.dispatch(data.action), opts);
  });
}

type DiscardCopy = Readonly<{ title?: string; message?: string; discardLabel?: string; keepLabel?: string }>;

/**
 * Show the shared "Discard changes?" confirm and run `onDiscard` only if the
 * user confirms. Use this for editors that close some other way than a stack
 * pop — e.g. a form `<Modal>` dismissed by its own close button, where
 * `useUnsavedGuard`'s navigation interception doesn't apply. Keeps the copy
 * identical to the navigation guard.
 */
export function confirmDiscardChanges(onDiscard: () => void, opts?: DiscardCopy) {
  Alert.alert(
    opts?.title ?? "Discard changes?",
    opts?.message ?? "You have unsaved changes. Leave without saving?",
    [
      { text: opts?.keepLabel ?? "Keep editing", style: "cancel" },
      { text: opts?.discardLabel ?? "Discard", style: "destructive", onPress: onDiscard },
    ],
  );
}

/**
 * Track whether a full-screen editor's form has diverged from its baseline —
 * the state it was last loaded or saved at. Feed `dirty` to `useUnsavedGuard`.
 *
 * Panel editors (a form that opens inside a list screen) don't need this — pass
 * their "form open" flag to the guard directly. This is for editors that ARE
 * the whole screen, where "mounted" isn't a useful dirty signal.
 *
 * Pass a JSON-serializable snapshot of the live form. The baseline is captured
 * once `ready` is true — gate it on remote data so an edit form that populates
 * asynchronously baselines against its loaded values (`ready={loaded}`), not
 * the empty initial state. Create forms that start empty can leave `ready` at
 * its default. Call `markSaved` after a save that stays on the screen so it
 * re-baselines; for a save that navigates away, gate the guard with a separate
 * "leaving" flag instead (re-baselining can't beat a synchronous `router.back`).
 */
export function useDirtyTracker(
  snapshot: unknown,
  ready = true,
): { dirty: boolean; markSaved: () => void } {
  const serialized = JSON.stringify(snapshot);
  const latest = useRef(serialized);
  latest.current = serialized;
  const [baseline, setBaseline] = useState<string | null>(null);

  useEffect(() => {
    if (ready && baseline === null) setBaseline(serialized);
  }, [ready, baseline, serialized]);

  const markSaved = useCallback(() => setBaseline(latest.current), []);
  const dirty = baseline !== null && serialized !== baseline;
  return { dirty, markSaved };
}
