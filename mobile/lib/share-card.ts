import { Share, Platform } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { RefObject } from "react";
import type { View } from "react-native";

export type CardTemplate = "word" | "proverb" | "achievement" | "symbol" | "cultural";

export type ShareCardData =
  | {
      template: "word";
      id?: string;
      word: string;
      translation: string;
      language: string;
      pronunciation?: string;
    }
  | {
      template: "proverb";
      languageId?: string;
      text: string;
      translation: string;
      language: string;
    }
  | {
      template: "achievement";
      title: string;
      detail: string;
    }
  | {
      template: "symbol";
      name: string;
      meaning: string;
      language: string;
    }
  | {
      template: "cultural";
      languageId?: string;
      title: string;
      description: string;
      category: string;
      emoji: string;
      language?: string;
    };

const SCHEME = "izonbeelimobile://";

type Translate = (key: string, opts?: object) => string;

export function buildShareMessage(data: ShareCardData, t: Translate): string {
  let msg: string;
  let deepLink = "";
  switch (data.template) {
    case "word":
      msg = `${data.word} — ${data.translation}\n\n${t("share.learningWith", { language: data.language })}`;
      if (data.id) deepLink = `${SCHEME}word/${data.id}?languageId=${encodeURIComponent(data.language)}`;
      break;
    case "proverb":
      msg = `"${data.text}"\n${data.translation}\n\n${t("share.learningWith", { language: data.language })}`;
      if (data.languageId) deepLink = `${SCHEME}proverbs/${data.languageId}`;
      break;
    case "achievement":
      msg = `${data.title}: ${data.detail}\n\n${t("share.learningGeneric")}`;
      deepLink = `${SCHEME}(tabs)/profile`;
      break;
    case "symbol":
      msg = `${data.name} — ${data.meaning}\n\n${t("share.learningWith", { language: data.language })}`;
      deepLink = `${SCHEME}adinkra`;
      break;
    case "cultural":
      msg = `${data.emoji} ${data.title}\n${data.description}${data.language ? `\n\n${t("share.learningWith", { language: data.language })}` : `\n\n${t("share.learningGeneric")}`}`;
      if (data.languageId) deepLink = `${SCHEME}cultural/${data.languageId}`;
      break;
  }
  return deepLink ? `${msg}\n\n${deepLink}` : msg;
}

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
