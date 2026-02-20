import { getProverbsForLanguage } from "@/lib/data/proverbs";
import { getDailyItem } from "@/lib/daily-picker";
import { ProverbCard } from "./proverb-card";

interface Props {
  languageId: string;
}

export function ProverbOfTheDay({ languageId }: Props) {
  const proverbs = getProverbsForLanguage(languageId);
  const proverb = getDailyItem(proverbs);

  if (!proverb) return null;

  return <ProverbCard proverb={proverb} />;
}
