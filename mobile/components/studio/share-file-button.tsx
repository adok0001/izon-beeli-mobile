import { GhostButton } from "@/components/studio/studio-form";
import { shareTextFile } from "@/lib/share-file";

/**
 * A ghost button that shares text as a file via the OS share sheet (Studio's
 * "Download sample / Export CSV" affordance). Wraps `shareTextFile`; surface any
 * failure through `onError` (e.g. a toast) — a user-cancelled share is not an
 * error.
 *
 * `contents` may be a thunk for a file that doesn't exist until it's asked for,
 * such as a dictionary export that has to be fetched first.
 */
export function ShareFileButton({
  label,
  fileName,
  contents,
  message,
  busy,
  onError,
}: Readonly<{
  label: string;
  fileName: string;
  contents: string | (() => Promise<string>);
  message?: string;
  /** Shows a pending label and blocks re-entry while the contents are fetched. */
  busy?: boolean;
  onError?: (err: unknown) => void;
}>) {
  const share = async () => {
    const text = typeof contents === "function" ? await contents() : contents;
    await shareTextFile(fileName, text, message);
  };

  return (
    <GhostButton
      label={busy ? "Preparing…" : label}
      onPress={() => { share().catch((e) => onError?.(e)); }}
      disabled={busy}
    />
  );
}
