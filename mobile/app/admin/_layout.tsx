import { StudioGate } from "@/components/studio/studio-gate";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Stack } from "expo-router";

export default function AdminLayout() {
  const M = useMuseumTheme();

  return (
    <StudioGate role="admin">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: M.ink },
        }}
      />
    </StudioGate>
  );
}
