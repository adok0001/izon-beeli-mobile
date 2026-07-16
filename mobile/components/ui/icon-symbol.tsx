// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'exclamationmark.triangle.fill': 'warning',
  'book.fill': 'menu-book',
  'headphones': 'headphones',
  'pencil.and.list.clipboard': 'edit-note',
  'newspaper.fill': 'dynamic-feed',
  'person.fill': 'person',
  'play.fill': 'play-arrow',
  'pause.fill': 'pause',
  'speaker.wave.2.fill': 'volume-up',
  'forward.fill': 'forward-10',
  'backward.fill': 'replay-10',
  'gobackward.5': 'replay-5',
  'goforward.10': 'forward-10',
  'chevron.left': 'chevron-left',
  'arrow.down': 'south',
  'list.bullet': 'format-list-bulleted',
  'text.quote': 'format-quote',
  'leaf.fill': 'eco',
  'cross.case.fill': 'medical-services',
  'cloud.sun.fill': 'wb-cloudy',
  'person.2.fill': 'groups',
  'star': 'star-border',
  'star.slash': 'star-outline',
  'speedometer': 'speed',
  'checkmark.circle.fill': 'check-circle',
  'circle': 'radio-button-unchecked',
  'clock': 'access-time',
  'flame.fill': 'local-fire-department',
  'star.fill': 'star',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'plus': 'add',
  'xmark': 'close',
  'magnifyingglass': 'search',
  'arrow.down.circle': 'download',
  'ellipsis': 'more-horiz',
  'message': 'chat-bubble-outline',
  'hand.thumbsup': 'thumb-up',
  'chart.bar.fill': 'bar-chart',
  'gearshape.fill': 'settings',
  'square.and.arrow.up': 'share',
  'mic.fill': 'mic',
  'waveform': 'graphic-eq',
  'arrow.up.circle.fill': 'send',
  'text.bubble': 'forum',
  'character.book.closed': 'auto-stories',
  'graduationcap.fill': 'school',
  'shield.fill': 'verified-user',
  'clock.fill': 'access-time',
  'checkmark.seal.fill': 'verified',
  'xmark.circle.fill': 'cancel',
  'list.bullet.clipboard': 'edit-note',
  'photo': 'photo',
  'photo.badge.plus': 'add-photo-alternate',
  'plus.circle': 'add-circle-outline',
  'calendar': 'calendar-today',
  'person.badge.shield.checkmark.fill': 'admin-panel-settings',
  'bell.fill': 'notifications',
  'bell': 'notifications-none',
  'trophy.fill': 'emoji-events',
  'snowflake': 'ac-unit',
  'arrow.counterclockwise': 'refresh',
  'megaphone': 'campaign',
  'globe.fill': 'language',
  'play.circle.fill': 'play-circle',
  'doc.text.fill': 'article',
  'film.stack': 'video-library',
  'checkmark': 'check',
  'questionmark': 'help-outline',
  'square.on.square': 'content-copy',
  'lock.fill': 'lock',
  'crown.fill': 'workspace-premium',
  'shield.slash.fill': 'remove-moderator',
  'repeat.1': 'repeat-one',
  'trash.fill': 'delete',
  'eye.fill': 'visibility',
  'pencil': 'edit',
  'line.3.horizontal': 'drag-handle',
  'square.grid.2x2': 'grid-view',
  'questionmark.circle.fill': 'help',
  'arrow.turn.down.right': 'subdirectory-arrow-right',
  'bookmark': 'bookmark-border',
  'bookmark.fill': 'bookmark',
  'flag.fill': 'flag',
  // Course-type, skill, and culture-category icons (replaced emoji-as-icons).
  'sunrise.fill': 'wb-twilight',
  'textformat.abc': 'abc',
  'basket.fill': 'shopping-basket',
  'sailboat.fill': 'sailing',
  'bubble.left.fill': 'chat',
  'building.2.fill': 'location-city',
  'music.note': 'music-note',
  'paintpalette.fill': 'palette',
  'puzzlepiece.fill': 'extension',
  'mappin': 'place',
  'figure.child': 'child-care',
  'party.popper.fill': 'celebration',
  'sparkles': 'auto-awesome',
  'tshirt.fill': 'checkroom',
  'fork.knife': 'restaurant',
  'hand.wave.fill': 'waving-hand',
  'building.columns.fill': 'balance',
  'person.3.fill': 'family-restroom',
  'moon.stars.fill': 'nights-stay',
  'theatermasks.fill': 'theater-comedy',
  'number.square.fill': 'calculate',
  'map.fill': 'map',
  'film.fill': 'movie',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
