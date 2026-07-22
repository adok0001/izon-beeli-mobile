import { LanguagePicker } from "@/components/ui/language-picker";
import { LANGUAGES } from "@/lib/mock-data";
import { useTranslation } from "react-i18next";

type LanguageStepProps = Readonly<{
  selectedLanguage: string | null;
  onSelect: (languageId: string) => void;
}>;

export function LanguageStep({ selectedLanguage, onSelect }: LanguageStepProps) {
  const { t } = useTranslation();

  return (
    <LanguagePicker
      value={selectedLanguage ?? ""}
      onSelect={onSelect}
      languages={LANGUAGES}
      title={t("contribute.whichLanguage")}
      subtitle={t("contribute.chooseLanguageDesc")}
    />
  );
}
