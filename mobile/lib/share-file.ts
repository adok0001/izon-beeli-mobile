import { File, Paths } from "expo-file-system";
import { Platform, Share } from "react-native";

/**
 * Share in-memory text as a file through the OS share sheet — "Save to Files",
 * send to another app, etc. Writes to the purgeable cache dir first, then shares
 * the file URI (the app's established `Share.share({ url })` pattern, see
 * `lib/share-card.ts`). On Expo web there's no file-share sheet, so it shares the
 * text directly. Throws on real failure so callers can surface it; a
 * user-cancelled share resolves without throwing.
 */
export async function shareTextFile(fileName: string, contents: string, message?: string): Promise<void> {
  if (Platform.OS === "web") {
    await Share.share({ message: contents });
    return;
  }
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  await Share.share(message ? { url: file.uri, message } : { url: file.uri });
}
