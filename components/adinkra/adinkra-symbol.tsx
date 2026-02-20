import Svg, { Path } from "react-native-svg";
import type { AdinkraSymbol } from "@/lib/data/adinkra";

interface Props {
  symbol: AdinkraSymbol;
  size?: number;
  color?: string;
}

export function AdinkraSymbolView({
  symbol,
  size = 60,
  color = "#1e293b",
}: Props) {
  const [, , width, height] = symbol.svgViewBox.split(" ").map(Number);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${width} ${height}`}>
      <Path d={symbol.svgPath} fill={color} />
    </Svg>
  );
}
