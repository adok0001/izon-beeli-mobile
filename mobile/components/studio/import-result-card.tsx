import { GhostButton, PrimaryButton } from "@/components/studio/studio-form";
import { StudioCard } from "@/components/studio/studio-card";
import {
  describeImportResult,
  type EditDiffRow,
  type ImportResult,
  type ResultStat,
} from "@/lib/import-result";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useState } from "react";
import { Text, View } from "react-native";

/**
 * The dry-run/confirm result card shared by the Studio import modes (content,
 * lessons, edit). Modes differ only in how they build rows and which endpoint
 * they hit; the presentation is identical, so it lives here and the copy lives
 * in `describeImportResult`, shared with the web renderer.
 *
 * Edit results arrive as `diff`, never as `preview` — the preview renderer walks
 * a row's values positionally and would print an `EditDiffRow` as
 * `[object Object]`.
 */
export function ImportResultCard({
  result,
  unit,
  busy,
  confirmLabel = "Import",
  onConfirm,
  onCancel,
}: Readonly<{
  result: ImportResult;
  /** Plural noun for the confirm button + overflow line, e.g. "rows" or "lessons". */
  unit: string;
  busy: boolean;
  /** Verb on the confirm button — "Import" for inserts, "Apply" for edits. */
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}>) {
  const M = useMuseumTheme();
  // Tracked against the result it was given for, not as a bare boolean: a
  // second dry run must re-ask before published words leave the app.
  const [ackFor, setAckFor] = useState<ImportResult | null>(null);
  const summary = describeImportResult(result, unit, confirmLabel);
  const locked = summary.needsAcknowledgement && ackFor !== result;
  const tones: Record<ResultStat["tone"], string> = {
    success: M.success, warning: M.warning, error: M.error, muted: M.muted,
  };

  return (
    <StudioCard accentColor={result.errors.length > 0 ? M.error : M.success}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: M.text }}>{summary.title}</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {summary.stats.map((stat) => (
            <Text key={stat.label} style={{ fontSize: 12, fontWeight: "700", color: tones[stat.tone] }}>
              {stat.label}
            </Text>
          ))}
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

      {result.diff?.map((row, i) => <DiffRow key={row.id} row={row} first={i === 0} />)}

      {summary.overflow > 0 && (
        <Text style={{ fontSize: 11, color: M.muted, marginTop: 6 }}>
          …and {summary.overflow} more {unit}
        </Text>
      )}

      {summary.warning && (
        <View style={{ marginTop: 12, borderRadius: 10, backgroundColor: M.warningBg, borderWidth: 1, borderColor: M.warningBorder, padding: 10, gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "800", color: M.warning }}>{summary.warning.title}</Text>
          <Text style={{ fontSize: 11, color: M.warning, lineHeight: 16 }}>{summary.warning.body}</Text>
        </View>
      )}

      {result.errors.length > 0 && (
        <View style={{ marginTop: 10, borderRadius: 10, backgroundColor: M.errorBg, borderWidth: 1, borderColor: M.errorBorder, padding: 10, gap: 4 }}>
          {result.errors.slice(0, 8).map((e, i) => (
            <Text key={i} style={{ fontSize: 11, color: M.error }}>{e.reason}</Text>
          ))}
        </View>
      )}

      {result.dryRun && onConfirm && (
        <View style={{ gap: 10, marginTop: 14 }}>
          {locked ? (
            <PrimaryButton label="I understand — let me apply these" onPress={() => setAckFor(result)} />
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={busy ? "Working…" : summary.confirmLabel}
                  onPress={onConfirm}
                  disabled={busy || summary.affected === 0}
                />
              </View>
              {onCancel && <GhostButton label="Cancel" onPress={onCancel} />}
            </View>
          )}
          {locked && onCancel && <GhostButton label="Cancel" onPress={onCancel} />}
        </View>
      )}
    </StudioCard>
  );
}

/** One changed entry: the word, then each field's before → after. */
function DiffRow({ row, first }: Readonly<{ row: EditDiffRow; first: boolean }>) {
  const M = useMuseumTheme();
  return (
    <View style={{ paddingVertical: 7, borderTopWidth: first ? 0 : 1, borderTopColor: M.border, gap: 3 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", color: M.text }}>{row.word}</Text>
        {row.unpublishes && (
          <Text style={{ fontSize: 10, fontWeight: "700", color: M.warning }}>un-publishes</Text>
        )}
      </View>
      {row.changes.map((change) => (
        <Text key={change.field} numberOfLines={2} style={{ fontSize: 11, color: M.muted, lineHeight: 16 }}>
          <Text style={{ fontWeight: "700", color: M.sub }}>{change.field}</Text>
          {"  "}
          {change.before ?? "—"} → {change.after ?? "—"}
        </Text>
      ))}
    </View>
  );
}
