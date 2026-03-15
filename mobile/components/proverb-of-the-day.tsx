import { useProverbs } from "@/lib/hooks/use-proverbs";
import { getDailyItem } from "@/lib/daily-picker";
import { ProverbCard } from "./proverb-card";

interface Props {
  languageId: string;
}

export function ProverbOfTheDay({ languageId }: Props) {
  const { data: proverbs = [] } = useProverbs(languageId);
  const proverb = getDailyItem(proverbs);

  if (!proverb) return null;

  return <ProverbCard proverb={proverb} />;
}
