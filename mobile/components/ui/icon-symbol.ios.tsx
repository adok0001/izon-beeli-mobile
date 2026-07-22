import { SymbolView, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';
import { type IconSymbolName } from './icon-symbol-mapping';

export { isIconSymbolName, type IconSymbolName } from './icon-symbol-mapping';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  // Deliberately narrower than expo-symbols' full union: iOS may only use
  // symbols that Android/web can also render. See ./icon-symbol-mapping.
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
