import { DiscoverRoom } from "@/components/explore/discover-room";
import { DISCOVER_TYPE_CONFIG } from "@/components/discover-card";
import { type DiscoverFilter } from "@/lib/hooks/use-discover";

export function CultureFeed({ filter }: { filter: DiscoverFilter }) {
  const color =
    filter === "all"
      ? "#C4862A"
      : DISCOVER_TYPE_CONFIG[filter as Exclude<DiscoverFilter, "all">].color;
  return <DiscoverRoom filter={filter} accentColor={color} />;
}
