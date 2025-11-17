import { matchFont } from '@shopify/react-native-skia';
import { Platform } from 'react-native';

/*
 * A hook that approximates the line width of a line for a specific font, given its
 * size.
 * */
export const useMonospaceCharMetrics = (fontSize: number) => {
  const font = matchFont({
    fontFamily: Platform.select({
      ios: 'Helvetica',
      android: 'monospace',
      default: 'serif',
    }),
    fontSize,
    fontWeight: 'normal',
    fontStyle: 'normal',
  });

  if (!font) {
    return { loaded: false as const, charWidth: 0 };
  }

  // Measure for width
  const text = 'M'; // more stable width
  const { width } = font.measureText(text);
  // We intentionally increase the width by 10% to make sure
  // we account for any errors LibSkia might do due to font
  // mismatches, different Canvas strokes and similar.
  const charWidth = (width / text.length) * 1.1;

  return {
    loaded: true as const,
    charWidth,
  };
};
