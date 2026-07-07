import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocalizedTextInput } from "@/components/ui/localized-text-input";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import type { LocalizedText } from "@/types";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View, type StyleProp, type TextStyle } from "react-native";
import { AudioAssetSheet, type AudioAssetSaveInput } from "./audio-asset-sheet";
import { useReplicaEditMode } from "./replica-edit-mode";
import { ReplicaFieldSheet } from "./replica-field-sheet";

type SaveState = "idle" | "saving" | "saved" | "error";

interface CommonProps {
  /** The normal (non-editing) rendering of this field — passed through
   * unchanged in Preview mode and for read-only viewers, so a converted
   * screen stays pixel-identical to the real learner screen when not editing. */
  children: ReactNode;
  /** Renders `children` bare with no edit affordance even in edit mode — for
   * fields that aren't backed by a real column yet (e.g. parsed multi-sense
   * text) rather than building editing speculatively. */
  disabled?: boolean;
  onError?: (error: Error) => void;
}

interface TextVariantProps extends CommonProps {
  variant: "text" | "multiline";
  value: string;
  onSave: (value: string) => Promise<unknown>;
  style?: StyleProp<TextStyle>;
  placeholder?: string;
}

interface LocalizedTextVariantProps extends CommonProps {
  variant: "localized-text";
  value: LocalizedText;
  label: string;
  onSave: (value: LocalizedText) => Promise<unknown>;
}

interface AudioAssetVariantProps extends CommonProps {
  variant: "audio-asset";
  value?: string | null;
  onSave: (input: AudioAssetSaveInput) => Promise<unknown>;
}

type ReplicaFieldProps = TextVariantProps | LocalizedTextVariantProps | AudioAssetVariantProps;

/** Small always-on badge replacing the hover affordance web can't have on
 * touch — pencil at rest, spinner while saving, checkmark/warning briefly
 * after a save resolves. */
function FieldBadge({ state }: Readonly<{ state: SaveState }>) {
  const M = useMuseumTheme();
  const icon = state === "saved" ? "checkmark" : state === "error" ? "exclamationmark.triangle.fill" : "pencil";
  const bg = state === "error" ? M.error : M.accent;

  return (
    <View
      style={{
        position: "absolute",
        top: -8,
        right: -8,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
      }}
    >
      {state === "saving" ? (
        <ActivityIndicator size="small" color={M.ink} style={{ transform: [{ scale: 0.6 }] }} />
      ) : (
        <IconSymbol name={icon} size={10} color={M.ink} />
      )}
    </View>
  );
}

function EditableWrapper({
  children,
  onPress,
  state,
}: Readonly<{ children: ReactNode; onPress: () => void; state: SaveState }>) {
  const M = useMuseumTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "relative",
        margin: -4,
        padding: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: M.accentBorder,
      }}
    >
      {children}
      <FieldBadge state={state} />
    </Pressable>
  );
}

/**
 * The editable-replica primitive: wraps a piece of learner-facing content so
 * a Studio editor can tap it to edit in place. RN has no hover, so the "hover
 * reveals an affordance" web pattern becomes "always show it in Edit mode."
 * Preview mode (or a read-only viewer) renders `children` completely bare.
 *
 * All hooks are called unconditionally, ahead of the variant-specific
 * rendering below — `editing`/`disabled` can flip between renders of the same
 * instance (toggling Edit/Preview), so the hook call order must never depend
 * on them.
 */
export function ReplicaField(props: ReplicaFieldProps) {
  const M = useMuseumTheme();
  const { editing } = useReplicaEditMode();
  const [state, setState] = useState<SaveState>("idle");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inlineEditing, setInlineEditing] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [localizedDraft, setLocalizedDraft] = useState<LocalizedText>({});

  useEffect(() => {
    if (sheetOpen && props.variant === "localized-text") {
      setLocalizedDraft(props.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen]);

  if (!editing || props.disabled) return <>{props.children}</>;

  const flashSaved = () => {
    setState("saved");
    setTimeout(() => setState("idle"), 1200);
  };
  const flashError = (err: Error) => {
    setState("error");
    props.onError?.(err);
    setTimeout(() => setState("idle"), 2000);
  };

  if (props.variant === "text" || props.variant === "multiline") {
    if (inlineEditing) {
      return (
        <TextInput
          autoFocus
          multiline={props.variant === "multiline"}
          value={textDraft}
          onChangeText={setTextDraft}
          placeholder={props.placeholder}
          placeholderTextColor={M.muted}
          style={[props.style, { borderWidth: 1, borderStyle: "dashed", borderColor: M.accent, borderRadius: 8, padding: 4, margin: -4 }]}
          onBlur={async () => {
            setInlineEditing(false);
            if (textDraft === props.value) return;
            setState("saving");
            try {
              await props.onSave(textDraft);
              flashSaved();
            } catch (err) {
              flashError(err as Error);
            }
          }}
        />
      );
    }
    return (
      <EditableWrapper
        state={state}
        onPress={() => {
          setTextDraft(props.value);
          setInlineEditing(true);
        }}
      >
        {props.children}
      </EditableWrapper>
    );
  }

  if (props.variant === "localized-text") {
    return (
      <>
        <EditableWrapper state={state} onPress={() => setSheetOpen(true)}>
          {props.children}
        </EditableWrapper>
        <ReplicaFieldSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title={props.label}>
          <LocalizedTextInput label={props.label} value={localizedDraft} onChange={setLocalizedDraft} />
          <Pressable
            onPress={async () => {
              setSheetOpen(false);
              setState("saving");
              try {
                await props.onSave(localizedDraft);
                flashSaved();
              } catch (err) {
                flashError(err as Error);
              }
            }}
            style={{ marginTop: 8, borderRadius: 12, backgroundColor: M.accent, paddingVertical: 12, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: M.ink }}>Save</Text>
          </Pressable>
        </ReplicaFieldSheet>
      </>
    );
  }

  // audio-asset — an explicit direct guard (rather than relying on the
  // preceding ifs having eliminated the other variants) so the union member's
  // function-typed `onSave` narrows correctly for the closure below.
  if (props.variant === "audio-asset") {
    return (
      <>
        <EditableWrapper state={state} onPress={() => setSheetOpen(true)}>
          {props.children}
        </EditableWrapper>
        <AudioAssetSheet
          visible={sheetOpen}
          onClose={() => setSheetOpen(false)}
          currentUrl={props.value}
          onSave={async (input) => {
            setState("saving");
            try {
              await props.onSave(input);
              flashSaved();
            } catch (err) {
              flashError(err as Error);
              throw err;
            }
          }}
        />
      </>
    );
  }

  return null;
}
