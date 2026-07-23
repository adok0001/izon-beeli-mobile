import { EntityPickerModal, type PickerItem } from "@/components/studio/entity-picker-modal";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

/**
 * The standard Studio single-value picker: a dropdown trigger that opens the
 * searchable `EntityPickerModal` sheet. Use this anywhere an educator picks one
 * thing from a set (language, course, scene, …) instead of a `StudioFilterPills`
 * row — pills are for filter/tab rows, dropdowns are for value selection.
 */
export function StudioDropdown({
  label,
  value,
  options,
  onChange,
  icon,
  placeholder = "Select…",
  title,
  disabled,
}: Readonly<{
  /** Small uppercase caption above the value, e.g. "Course". */
  label?: string;
  value: string;
  options: PickerItem[];
  onChange: (id: string) => void;
  icon?: IconSymbolName;
  placeholder?: string;
  /** Sheet heading; defaults to `label` (or "Select"). */
  title?: string;
  disabled?: boolean;
}>) {
  const M = useMuseumTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10,
          borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
          backgroundColor: M.bg, borderWidth: 1, borderColor: M.border,
          opacity: disabled ? 0.5 : 1,
        }}
        className="active:opacity-70"
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          {icon && <IconSymbol name={icon} size={15} color={M.accent} />}
          <View style={{ flex: 1 }}>
            {label && (
              <Text style={{ fontSize: 10, fontWeight: "700", color: M.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                {label}
              </Text>
            )}
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: selected ? M.text : M.muted }}>
              {selected?.label ?? placeholder}
            </Text>
          </View>
        </View>
        <IconSymbol name="chevron.down" size={14} color={M.muted} />
      </Pressable>

      <EntityPickerModal
        visible={open}
        title={title ?? label ?? "Select"}
        items={options}
        selectedId={value}
        onSelect={(id) => { onChange(id); setOpen(false); }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
