import { LanguagePicker } from "@/components/ui/language-picker";
import { useLanguages } from "@/store/languages-store";
import { useTranslation } from "react-i18next";

type LanguageStepProps = Readonly<{
  selectedLanguage: string | null;
  onSelect: (languageId: string) => void;
}>;

export function LanguageStep({ selectedLanguage, onSelect }: LanguageStepProps) {
  const { t } = useTranslation();
  const languages = useLanguages();

  return (
    <LanguagePicker
      value={selectedLanguage ?? ""}
      onSelect={onSelect}
      languages={languages}
      title={t("contribute.whichLanguage")}
      subtitle={t("contribute.chooseLanguageDesc")}
    />
  );
}
