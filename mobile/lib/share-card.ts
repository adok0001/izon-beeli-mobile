import { Share, Platform } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { RefObject } from "react";
import type { View } from "react-native";

export type CardTemplate = "word" | "proverb" | "achievement" | "symbol" | "cultural";

export async function captureAndShare(
  viewRef: RefObject<View | null>,
  fallbackMessage: string
) {
  try {
    if (viewRef.current) {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
      });

      if (Platform.OS === "web") {
        // Web fallback: share text only
        await Share.share({ message: fallbackMessage });
      } else {
        await Share.share({
          url: uri,
          message: fallbackMessage,
        });
      }
    } else {
      // Fallback if ref not available
      await Share.share({ message: fallbackMessage });
    }
  } catch {
    // User cancelled or error
  }
}
