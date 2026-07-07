import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { createContext, useContext, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface ReplicaEditModeValue {
  /** True only when the viewer can edit AND has toggled into edit mode. */
  editing: boolean;
  /** Whether the viewer can edit at all, regardless of the current toggle state. */
  canEdit: boolean;
}

const ReplicaEditModeContext = createContext<ReplicaEditModeValue | null>(null);

/** Read the nearest {@link ReplicaEditModeProvider}'s state. `ReplicaField` uses
 * this so screens don't have to thread `editing`/`canEdit` through every field. */
export function useReplicaEditMode(): ReplicaEditModeValue {
  const value = useContext(ReplicaEditModeContext);
  if (!value) {
    throw new Error("useReplicaEditMode must be used within a <ReplicaEditModeProvider>");
  }
  return value;
}

/**
 * Wraps a replica-editable screen. Owns the Edit/Preview toggle state and
 * gates it on `canEdit` — a read-only viewer never enters edit mode, so
 * `ReplicaField`s render bare with no tap affordance for them.
 */
export function ReplicaEditModeProvider({
  canEdit,
  children,
}: Readonly<{ canEdit: boolean; children: ReactNode }>) {
  const [editing, setEditing] = useState(true);

  return (
    <ReplicaEditModeContext.Provider value={{ editing: canEdit && editing, canEdit }}>
      {canEdit && <ReplicaModeToggle editing={editing} onChange={setEditing} />}
      {children}
    </ReplicaEditModeContext.Provider>
  );
}

function ReplicaModeToggle({ editing, onChange }: Readonly<{ editing: boolean; onChange: (editing: boolean) => void }>) {
  const M = useMuseumTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignSelf: "flex-end",
        marginBottom: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: M.border,
        backgroundColor: M.card,
        padding: 3,
      }}
    >
      {(["edit", "preview"] as const).map((mode) => {
        const active = mode === "edit" ? editing : !editing;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode === "edit")}
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
            <Text style={{ fontSize: 12, fontWeight: "700", color: active ? M.ink : M.muted, textTransform: "capitalize" }}>
              {mode}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
