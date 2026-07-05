import { useMuseumTheme } from "@/lib/use-museum-theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

/** Shared by the mobile dictionary and lesson editors — a bare date-time
 * picker that calls the guarded /schedule-publish endpoint via the caller's
 * mutation, mirroring web's schedule-publish-modal.tsx. */
export function SchedulePublishModal({
  onClose, onSchedule, saving,
}: Readonly<{ onClose: () => void; onSchedule: (publishAt: Date) => void; saving: boolean }>) {
  const M = useMuseumTheme();
  const [value, setValue] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 340, borderRadius: 20, backgroundColor: M.bg, padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: M.text }}>Schedule publish</Text>
          <DateTimePicker
            value={value}
            mode="datetime"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(_, selected) => selected && setValue(selected)}
          />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Pressable onPress={onClose} style={{ borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }} className="active:opacity-70">
              <Text style={{ fontWeight: "700", color: M.sub, fontSize: 14 }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSchedule(value)}
              disabled={saving || value.getTime() <= Date.now()}
              style={{ borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: M.accent, opacity: saving || value.getTime() <= Date.now() ? 0.4 : 1 }}
              className="active:opacity-80"
            >
              <Text style={{ fontWeight: "800", color: M.ink, fontSize: 14 }}>{saving ? "Scheduling…" : "Schedule"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
