import type { IconSymbolName } from "@/components/ui/icon-symbol";
import type { DiscoverContentType } from "@/types";

/** Icon per discover content type — the glyph shown on discover/series covers. */
export function discoverTypeIcon(type: DiscoverContentType): IconSymbolName {
  switch (type) {
    case "blog":
      return "doc.text.fill";
    case "podcast":
      return "headphones";
    case "film":
      return "play.circle.fill";
    default:
      return "sparkles";
  }
}
