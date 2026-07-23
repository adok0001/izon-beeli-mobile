import { GhostButton, PrimaryButton } from "@/components/studio/studio-form";
import { StudioCard } from "@/components/studio/studio-card";
import type { UnifiedImportResult } from "@/lib/hooks/educator/use-unified-import";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { Text, View } from "react-native";

/**
 * The dry-run/confirm result card shared by the Studio import modes (content,
 * lessons). Modes differ only in how they build rows and which endpoint they
 * hit; the result presentation is identical, so it lives here. When `onConfirm`
 * is set and the result is a dry run, the confirm/cancel row is shown.
 */
export function ImportResultCard({
  result,
  unit,
  busy,
  onConfirm,
  onCancel,
}: Readonly<{
  result: UnifiedImportResult;
  /** Plural noun for the confirm button + overflow line, e.g. "rows" or "lessons". */
  unit: string;
  busy: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}>) {
  const M = useMuseumTheme();
  const shownPreview = result.preview?.length ?? 0;

  return (
    <StudioCard accentColor={result.errors.length > 0 ? M.error : M.success}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: M.text }}>
          {result.dryRun ? "Preview" : "Imported"}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {result.dryRun ? (
            <>
              <Text style={{ fontSize: 12, fontWeight: "700", color: M.success }}>{result.valid} valid</Text>
              {result.errors.length > 0 && (
                <Text style={{ fontSize: 12, fontWeight: "700", color: M.error }}>{result.errors.length} errors</Text>
              )}
            </>
          ) : (
            <>
              <Text style={{ fontSize: 12, fontWeight: "700", color: M.success }}>{result.inserted} added</Text>
              {result.skipped ? (
                <Text style={{ fontSize: 12, fontWeight: "700", color: M.warning }}>{result.skipped} skipped</Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      {result.preview?.map((row, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 10, paddingVertical: 5, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: M.border }}>
          {Object.values(row).map((v, j) => (
            <Text
              key={j}
              numberOfLines={1}
              style={{ flex: j === 0 ? 0 : 1, fontSize: 12, fontWeight: j === 0 ? "800" : "400", color: j === 0 ? M.text : M.muted }}
            >
              {String(v)}
            </Text>
          ))}
        </View>
      ))}
      {(result.total ?? 0) > shownPreview && (
        <Text style={{ fontSize: 11, color: M.muted, marginTop: 4 }}>
          …and {(result.total ?? 0) - shownPreview} more {unit}
        </Text>
      )}

      {result.errors.length > 0 && (
        <View style={{ marginTop: 10, borderRadius: 10, backgroundColor: M.errorBg, borderWidth: 1, borderColor: M.errorBorder, padding: 10, gap: 4 }}>
          {result.errors.slice(0, 8).map((e, i) => (
            <Text key={i} style={{ fontSize: 11, color: M.error }}>{e.reason}</Text>
          ))}
        </View>
      )}

      {result.dryRun && onConfirm && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label={busy ? "Importing…" : `Import ${result.valid} ${unit}`}
              onPress={onConfirm}
              disabled={busy || (result.valid ?? 0) === 0}
            />
          </View>
          {onCancel && <GhostButton label="Cancel" onPress={onCancel} />}
        </View>
      )}
    </StudioCard>
  );
}
