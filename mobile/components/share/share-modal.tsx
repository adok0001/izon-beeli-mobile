import { useRef, useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShareCardPreview } from "./share-card-preview";
import { captureAndShare } from "@/lib/share-card";

interface Props {
  visible: boolean;
  onClose: () => void;
  data:
    | {
        template: "word";
        word: string;
        translation: string;
        language: string;
        pronunciation?: string;
      }
    | {
        template: "proverb";
        text: string;
        translation: string;
        language: string;
      }
    | {
        template: "achievement";
        title: string;
        detail: string;
      };
}

export function ShareModal({ visible, onClose, data }: Props) {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    let msg = "";
    if (data.template === "word") {
      msg = `${data.word} — ${data.translation}\n\nLearning ${data.language} with Izon Beeli`;
    } else if (data.template === "proverb") {
      msg = `"${data.text}"\n${data.translation}\n\nLearning ${data.language} with Izon Beeli`;
    } else {
      msg = `${data.title}: ${data.detail}\n\nLearning with Izon Beeli`;
    }
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
            <Text className="text-base text-neutral-500">Cancel</Text>
          </Pressable>
          <Text className="text-base font-semibold text-neutral-900 dark:text-white">
            Share Card
          </Text>
          <Pressable onPress={handleShare} disabled={sharing}>
            <Text
              className={`text-base font-semibold ${
                sharing ? "text-neutral-300" : "text-blue-500"
              }`}
            >
              Share
            </Text>
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <ShareCardPreview ref={cardRef} {...data} />

          <Text className="mt-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
            Tap Share to send this card
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
