import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput } from "@/components/ui/localized-text-input";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { LocalizedText } from "@/types";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { AudioAssetSheet, type AudioAssetSaveInput } from "./audio-asset-sheet";
import { useReplicaEditMode } from "./replica-edit-mode";
import { ReplicaFieldSheet } from "./replica-field-sheet";

type SaveState = "idle" | "saving" | "error";

interface CommonProps {
  /** The normal (non-editing) rendering of this field — passed through
   * untouched in Preview mode and for read-only viewers, so a converted screen
   * stays identical to the real learner screen when not editing. */
  children: ReactNode;
  /** Human label for the sheet header and the accessibility action. */
  label: string;
  /** Renders `children` bare with no edit affordance even in edit mode — for
   * fields with no backing column to write to. */
  disabled?: boolean;
  onError?: (error: Error) => void;
}

interface TextVariantProps extends CommonProps {
  variant: "text" | "multiline";
  value: string;
  placeholder?: string;
  onSave: (value: string) => Promise<unknown>;
}

interface LocalizedTextVariantProps extends CommonProps {
  variant: "localized-text";
  value: LocalizedText;
  multiline?: boolean;
  onSave: (value: LocalizedText) => Promise<unknown>;
}

interface AudioAssetVariantProps extends CommonProps {
  variant: "audio-asset";
  value?: string | null;
  onSave: (input: AudioAssetSaveInput) => Promise<unknown>;
}

type ReplicaFieldProps = TextVariantProps | LocalizedTextVariantProps | AudioAssetVariantProps;

/** Drops empty strings so `{en: "x", fr: ""}` and `{en: "x"}` compare equal. */
function normalizeMap(map: LocalizedText): LocalizedText {
  return Object.fromEntries(Object.entries(map).filter(([, v]) => v?.trim()));
}

/**
 * Shared save plumbing. The error timer is cleared on unmount — the first
 * version leaked timers that fired `setState` on unmounted fields whenever a
 * save-triggered refetch tore the row down.
 */
function useFieldSave(onError?: (error: Error) => void) {
  const [state, setState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = useCallback(
    async (save: () => Promise<unknown>): Promise<boolean> => {
      setState("saving");
      try {
        await save();
        setState("idle");
        return true;
      } catch (err) {
        setState("error");
        onError?.(err as Error);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 2500);
        return false;
      }
    },
    [onError]
  );

  return { state, run };
}

/**
 * The tap target drawn around a piece of learner-facing content in edit mode.
 *
 * The outline and the badge are both **absolutely positioned**, so the wrapper
 * adds no size of its own and toggling Preview/Edit can't shift the layout —
 * the first version padded and bordered the box, which nudged every wrapped
 * field and broke the "identical to the real screen" premise it was selling.
 * They also sit flush with the content bounds rather than at a negative inset,
 * because Android clips children that overflow a rounded parent (the example
 * card has a 12pt radius).
 */
function EditableWrapper({
  children,
  onPress,
  state,
  label,
}: Readonly<{ children: ReactNode; onPress: () => void; state: SaveState; label: string }>) {
  const M = useMuseumTheme();
  const isError = state === "error";
  const tint = isError ? M.error : M.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={state === "saving"}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${label}`}
      style={{ position: "relative" }}
    >
      {children}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 8,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: isError ? M.error : M.accentBorder,
          backgroundColor: isError ? M.errorBg : "transparent",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 15,
          height: 15,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tint,
        }}
      >
        {state === "saving" ? (
          <ActivityIndicator size="small" color={M.ink} style={{ transform: [{ scale: 0.5 }] }} />
        ) : (
          <IconSymbol
            name={isError ? "exclamationmark.triangle.fill" : "pencil"}
            size={9}
            color={M.ink}
          />
        )}
      </View>
    </Pressable>
  );
}

function TextField(props: TextVariantProps) {
  const M = useMuseumTheme();
  const { state, run } = useFieldSave(props.onError);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const openSheet = () => {
    setDraft(props.value);
    setOpen(true);
  };

  return (
    <>
      <EditableWrapper state={state} label={props.label} onPress={openSheet}>
        {props.children}
      </EditableWrapper>
      <ReplicaFieldSheet
        visible={open}
        title={props.label}
        saving={state === "saving"}
        dirty={draft.trim() !== props.value.trim()}
        onCancel={() => setOpen(false)}
        onSave={async () => {
          const ok = await run(() => props.onSave(draft.trim()));
          if (ok) setOpen(false);
        }}
      >
        <TextInput
          autoFocus
          multiline={props.variant === "multiline"}
          value={draft}
          onChangeText={setDraft}
          placeholder={props.placeholder}
          placeholderTextColor={M.muted}
          style={{
            borderRadius: 10,
            borderWidth: 1,
            borderColor: M.border,
            backgroundColor: M.bg,
            color: M.text,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 15,
            minHeight: props.variant === "multiline" ? 96 : undefined,
            textAlignVertical: props.variant === "multiline" ? "top" : "center",
          }}
        />
      </ReplicaFieldSheet>
    </>
  );
}

function LocalizedField(props: LocalizedTextVariantProps) {
  const { state, run } = useFieldSave(props.onError);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocalizedText>({});

  const openSheet = () => {
    setDraft(props.value);
    setOpen(true);
  };

  const dirty = JSON.stringify(normalizeMap(draft)) !== JSON.stringify(normalizeMap(props.value));

  return (
    <>
      <EditableWrapper state={state} label={props.label} onPress={openSheet}>
        {props.children}
      </EditableWrapper>
      <ReplicaFieldSheet
        visible={open}
        title={props.label}
        saving={state === "saving"}
        dirty={dirty}
        onCancel={() => setOpen(false)}
        onSave={async () => {
          const ok = await run(() => props.onSave(normalizeMap(draft)));
          if (ok) setOpen(false);
        }}
      >
        <LocalizedTextInput
          label={props.label}
          value={draft}
          onChange={setDraft}
          multiline={props.multiline}
        />
      </ReplicaFieldSheet>
    </>
  );
}

function AudioField(props: AudioAssetVariantProps) {
  const { state, run } = useFieldSave(props.onError);
  const [open, setOpen] = useState(false);

  return (
    <>
      <EditableWrapper state={state} label={props.label} onPress={() => setOpen(true)}>
        {props.children}
      </EditableWrapper>
      <AudioAssetSheet
        visible={open}
        title={props.label}
        currentUrl={props.value}
        saving={state === "saving"}
        onClose={() => setOpen(false)}
        onSave={async (input) => {
          const ok = await run(() => props.onSave(input));
          if (ok) setOpen(false);
        }}
      />
    </>
  );
}

/**
 * The editable-replica primitive: wraps a piece of learner-facing content so a
 * Studio editor can tap it and edit it in a sheet, while the surrounding screen
 * stays a faithful copy of what the learner sees.
 *
 * Editing is deliberately *not* inline. The original version put a `TextInput`
 * in place and committed on blur, which meant a background refetch could unmount
 * the input mid-word and commit a half-typed value with no way to cancel.
 */
export function ReplicaField(props: ReplicaFieldProps) {
  const { editing } = useReplicaEditMode();

  if (!editing || props.disabled) return <>{props.children}</>;

  switch (props.variant) {
    case "text":
    case "multiline":
      return <TextField {...props} />;
    case "localized-text":
      return <LocalizedField {...props} />;
    case "audio-asset":
      return <AudioField {...props} />;
  }
}

/** Muted stand-in shown in edit mode for an optional field the entry doesn't
 * have yet, so an educator can add one by tapping where it will appear. */
export function ReplicaPlaceholder({ text }: Readonly<{ text: string }>) {
  const M = useMuseumTheme();
  return (
    <Text style={{ fontSize: 14, fontStyle: "italic", color: M.muted, textAlign: "center" }}>{text}</Text>
  );
}
