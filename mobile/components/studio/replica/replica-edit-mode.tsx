import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ReplicaEditModeValue {
  /** True only when the viewer can edit AND has toggled into edit mode. */
  editing: boolean;
  /** Whether the viewer can edit at all, regardless of the current toggle state. */
  canEdit: boolean;
}

const ReplicaEditModeContext = createContext<ReplicaEditModeValue>({ editing: false, canEdit: false });

/** Read the nearest {@link ReplicaEditModeProvider}'s state. Defaults to
 * not-editing when there is no provider, so the learner-facing screens that
 * share these components render bare without needing to wrap anything. */
export function useReplicaEditMode(): ReplicaEditModeValue {
  return useContext(ReplicaEditModeContext);
}

/**
 * Wraps a replica-editable screen: owns the Preview/Edit toggle and gates it on
 * `canEdit`, so a read-only viewer never sees a tap affordance.
 *
 * Defaults to **Preview**. The whole point of a replica is that it looks like
 * the real learner screen; opening straight into Edit (as the first version did)
 * buries that under dashed outlines before the editor has even asked to edit.
 */
export function ReplicaEditModeProvider({
  canEdit,
  children,
}: Readonly<{ canEdit: boolean; children: ReactNode }>) {
  const [editing, setEditing] = useState(false);
  const value = useMemo(() => ({ editing: canEdit && editing, canEdit }), [canEdit, editing]);

  return (
    <ReplicaEditModeContext.Provider value={value}>
      {canEdit && <ReplicaModeToggle editing={editing} onChange={setEditing} />}
      {children}
    </ReplicaEditModeContext.Provider>
  );
}

function ReplicaModeToggle({
  editing,
  onChange,
}: Readonly<{ editing: boolean; onChange: (editing: boolean) => void }>) {
  const M = useMuseumTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignSelf: "flex-end",
        marginHorizontal: 20,
        marginBottom: 4,
        marginTop: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: M.border,
        backgroundColor: M.card,
        padding: 3,
      }}
    >
      {(["preview", "edit"] as const).map((mode) => {
        const active = mode === "edit" ? editing : !editing;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode === "edit")}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: active ? M.accent : "transparent",
            }}
          >
            <IconSymbol
              name={mode === "edit" ? "pencil" : "eye.fill"}
              size={12}
              color={active ? M.ink : M.muted}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: active ? M.ink : M.muted,
                textTransform: "capitalize",
              }}
            >
              {mode}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
