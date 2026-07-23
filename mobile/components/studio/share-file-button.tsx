import { GhostButton } from "@/components/studio/studio-form";
import { shareTextFile } from "@/lib/share-file";

/**
 * A ghost button that shares in-memory text as a file via the OS share sheet
 * (Studio's "Download sample / Export CSV" affordance). Wraps `shareTextFile`;
 * surface any failure through `onError` (e.g. a toast) — a user-cancelled share
 * is not an error.
 */
export function ShareFileButton({
  label,
  fileName,
  contents,
  message,
  onError,
}: Readonly<{
  label: string;
  fileName: string;
  contents: string;
  message?: string;
  onError?: (err: unknown) => void;
}>) {
  return (
    <GhostButton
      label={label}
      onPress={() => { shareTextFile(fileName, contents, message).catch((e) => onError?.(e)); }}
    />
  );
}
