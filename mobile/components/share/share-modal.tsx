import { captureAndShare } from "@/lib/share-card";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShareCardPreview } from "./share-card-preview";

interface Props {
  visible: boolean;
  onClose: () => void;
  data:
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
}

export function ShareModal({ visible, onClose, data }: Props) {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    let msg = "";
    let deepLink = "";
    if (data.template === "word") {
      msg = `${data.word} — ${data.translation}\n\n${t("share.learningWith", { language: data.language })}`;
      if (data.id) deepLink = `izonbeelimobile://word/${data.id}?languageId=${encodeURIComponent(data.language)}`;
    } else if (data.template === "proverb") {
      msg = `"${data.text}"\n${data.translation}\n\n${t("share.learningWith", { language: data.language })}`;
      if (data.languageId) deepLink = `izonbeelimobile://proverbs/${data.languageId}`;
    } else if (data.template === "achievement") {
      msg = `${data.title}: ${data.detail}\n\n${t("share.learningGeneric")}`;
      deepLink = "izonbeelimobile://(tabs)/profile";
    } else if (data.template === "symbol") {
      msg = `${data.name} — ${data.meaning}\n\n${t("share.learningWith", { language: data.language })}`;
      deepLink = "izonbeelimobile://adinkra";
    } else {
      msg = `${data.emoji} ${data.title}\n${data.description}${data.language ? `\n\n${t("share.learningWith", { language: data.language })}` : `\n\n${t("share.learningGeneric")}`}`;
      if (data.languageId) deepLink = `izonbeelimobile://cultural/${data.languageId}`;
    }
    if (deepLink) msg += `\n\n${deepLink}`;
    await captureAndShare(cardRef, msg);
    setSharing(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-700">
          <Pressable onPress={onClose}>
            <Text className="text-base text-neutral-500">{t("common.cancel")}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            {t("share.cardTitle")}
          </Text>
          <Pressable onPress={handleShare} disabled={sharing}>
            <Text
              className={`text-base font-semibold ${
                sharing ? "text-neutral-300" : "text-blue-500"
              }`}
            >
              {t("share.shareButton")}
            </Text>
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <ShareCardPreview ref={cardRef} {...data} />

          <Text className="mt-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
            {t("share.tapToSend")}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
