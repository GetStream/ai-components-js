import React, { type PropsWithChildren, useMemo } from 'react';
import {
  PixelRatio,
  Platform,
  type ProcessedColorValue,
  Text,
} from 'react-native';

import './prism-config';

import SyntaxHighlighter, {
  Prism as SyntaxHighlighterPrism,
  type SyntaxHighlighterProps,
} from 'react-syntax-highlighter';
// @ts-expect-error createStyleObject is not available in the type exports, it is still exported though
import { createStyleObject } from 'react-syntax-highlighter/dist/esm/create-element';
import { defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { prism as prismDefaultStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cssToRNTextStyle } from './converter';
import type {
  NativeSyntaxHighlighterProps,
  RNSheet,
  RNStyle,
  SyntaxHighlighterStylesheet,
} from './types.ts';
import { MarkdownReactiveScrollView } from '../components';
import { PerfText } from '../PerfText.tsx';

const DEFAULT_FONT_SIZE = 13;

const generateNewStylesheet = ({
  stylesheet,
  highlighter,
}: {
  stylesheet: SyntaxHighlighterStylesheet;
  highlighter: NativeSyntaxHighlighterProps['highlighter'];
}) => {
  stylesheet = Array.isArray(stylesheet) ? stylesheet[0] : stylesheet;

  const transformedStyle = Object.entries(stylesheet ?? {}).reduce<RNSheet>(
    (newStylesheet, [className, style]) => {
      const rn = cssToRNTextStyle(style);

      newStylesheet[className] = rn as RNStyle;
      return newStylesheet;
    },
    {},
  );

  const topLevel = (
    highlighter === 'prism'
      ? transformedStyle['pre[class*="language-"]']
      : transformedStyle.hljs
  ) as RNStyle;

  const defaultColor = (topLevel && topLevel.color) || '#000';

  return { transformedStyle, defaultColor };
};

const createChildren = ({
  stylesheet,
  fontSize,
  fontFamily,
}: {
  stylesheet: SyntaxHighlighterStylesheet;
  fontSize?: number;
  fontFamily?: string;
}) => {
  let childrenCount = 0;
  return (children: rendererNode['children'], defaultColor: string) => {
    childrenCount += 1;
    return (children ?? []).map((child, i) =>
      createNativeElement({
        node: child,
        stylesheet,
        key: `code-segment-${childrenCount}-${i}`,
        defaultColor,
        fontSize,
        fontFamily,
      }),
    );
  };
};

const createNativeElement = ({
  node,
  stylesheet,
  key,
  defaultColor,
  fontFamily,
  fontSize = DEFAULT_FONT_SIZE,
}: {
  node: rendererNode;
  stylesheet: SyntaxHighlighterStylesheet;
  key: string;
  defaultColor: string;
  fontFamily?: string;
  fontSize?: number;
}) => {
  const { properties, type, tagName: TagName, value } = node;
  const startingStyle = { fontFamily, fontSize, height: fontSize + 5 };
  if (type === 'text') {
    return (
      <Text
        key={key}
        style={Object.assign({ color: defaultColor }, startingStyle)}
      >
        {value}
      </Text>
    );
  } else if (TagName) {
    const childrenFactory = createChildren({
      stylesheet,
      fontSize,
      fontFamily,
    });
    const style = properties
      ? createStyleObject(
          properties.className,
          Object.assign(
            { color: defaultColor },
            properties.style,
            startingStyle,
          ),
          stylesheet,
        )
      : {};
    const children = childrenFactory(
      node.children,
      style.color || defaultColor,
    );
    return (
      <Text key={key} style={style}>
        {children}
      </Text>
    );
  }
};

import { processColor } from 'react-native';
import { matchFont } from '@shopify/react-native-skia';

// type RendererNode = {
//   type: string;
//   value?: string;
//   tagName?: string;
//   properties?: {
//     className?: string[];
//     style?: Record<string, any>;
//     [key: string]: any;
//   };
//   children?: RendererNode[] | any; // the lib is loose here anyway
// };

export type ColorRange = {
  start: number;
  end: number;
  color: ProcessedColorValue;
};

type FlattenOptions = {
  nodes: rendererNode | rendererNode[];
  stylesheet: SyntaxHighlighterStylesheet;
  defaultColor: string;
  fontFamily?: string;
  fontSize?: number;
};

export function flattenNodesToTextAndColorRanges({
  nodes,
  stylesheet,
  defaultColor,
  fontFamily,
  fontSize = 13,
}: FlattenOptions): { text: string; ranges: ColorRange[] } {
  let text = '';
  const rawRanges: { start: number; end: number; color: string | number }[] =
    [];

  const startingStyle = { fontFamily, fontSize };

  const walk = (
    node: rendererNode | null | undefined,
    inheritedColor: string | number,
  ) => {
    if (!node) return;

    const { type, tagName, value, properties } = node;

    // leaf node
    if (type === 'text') {
      if (value == null || value === '') return;
      const chunk = String(value);
      const start = text.length;
      text += chunk;

      const color = inheritedColor ?? defaultColor;
      if (color != null && chunk.length) {
        rawRanges.push({ start, end: start + chunk.length, color });
      }
      return;
    }

    // node with children
    if (tagName) {
      const baseStyle =
        properties && properties.className
          ? createStyleObject(
              properties.className,
              Object.assign(
                { color: defaultColor },
                properties.style,
                startingStyle,
              ),
              stylesheet,
            )
          : { ...startingStyle, color: defaultColor };

      // we take the node's color if present, then its inherited color
      // if present and finally the block's default color if all else
      // fails.
      const effectiveColor =
        (baseStyle as any).color ?? inheritedColor ?? defaultColor;

      const children = node.children || [];
      const childArray = Array.isArray(children) ? children : [children];
      for (let i = 0; i < childArray.length; i++) {
        walk(childArray[i], effectiveColor);
      }
      return;
    }

    // fallback
    if (value != null) {
      const chunk = String(value);
      const start = text.length;
      text += chunk;
      const color = inheritedColor ?? defaultColor;
      if (color != null && chunk.length) {
        rawRanges.push({ start, end: start + chunk.length, color });
      }
    }
  };

  // Recursively flatten nodes
  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
  for (let i = 0; i < nodeArray.length; i++) {
    walk(nodeArray[i], defaultColor);
  }

  // Merge adjacent ranges with same color and convert them to integers
  rawRanges.sort((a, b) => a.start - b.start);
  const merged: ColorRange[] = [];
  for (let i = 0; i < rawRanges.length; i++) {
    const r = rawRanges[i]!;
    // in case the color is malformed for some reason, use the defaultColor
    // as this one should always be non-nullish.
    const colorInt = processColor(r.color)!; // ?? processColor(defaultColor))!;

    if (!merged.length) {
      merged.push({ start: r.start, end: r.end, color: colorInt });
      continue;
    }

    const last = merged[merged.length - 1];
    if (last && last.end === r.start && last.color === colorInt) {
      last.end = r.end;
    } else {
      merged.push({ start: r.start, end: r.end, color: colorInt });
    }
  }

  return { text, ranges: merged };
}

export function flattenRowsToTextAndColorRanges(
  rows: rendererNode[],
  opts: Omit<FlattenOptions, 'nodes'>,
): { text: string; ranges: ColorRange[]; longestLine: number } {
  let fullText = '';
  let longestLine = 0;
  const fullRanges: ColorRange[] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const rowNodes = rows[rowIndex];

    const { text, ranges } = flattenNodesToTextAndColorRanges({
      ...opts,
      nodes: rowNodes ?? [],
    });

    const offset = fullText.length;
    fullText += text;
    longestLine = Math.max(text.length, longestLine);

    // Add newline between rows (no color)
    if (rowIndex < rows.length - 1) {
      fullText += '\n';
    }

    // Shift ranges by current offset & push
    for (const r of ranges) {
      fullRanges.push({
        start: r.start + offset,
        end: r.end + offset,
        color: r.color,
      });
    }
  }

  return { text: fullText, ranges: fullRanges, longestLine };
}

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

const AndroidNativeRenderer = ({
  rows,
  stylesheet,
  defaultColor,
  fontFamily,
  fontSize,
  lineHeight = 17,
}: {
  rows: rendererNode[];
  stylesheet: rendererProps['stylesheet'];
  defaultColor: string;
  fontFamily?: string;
  fontSize: number;
  lineHeight: number;
}) => {
  const { text, ranges, longestLine } = flattenRowsToTextAndColorRanges(rows, {
    stylesheet,
    defaultColor,
    fontFamily,
    fontSize,
  });

  const { charWidth } = useMonospaceCharMetrics(fontSize);

  const width = longestLine * charWidth;

  // We respect the device's pixel density ratio in order to precalculate
  // the height of the view.
  const px = PixelRatio.getPixelSizeForLayoutSize(lineHeight);
  const height = rows.length * px * 0.85;

  return (
    <PerfText
      style={{ height, width }}
      text={text}
      ranges={ranges}
      lineHeight={lineHeight}
      fontSize={fontSize}
    />
  );
};

const nativeRenderer = ({
  defaultColor,
  fontFamily,
  fontSize,
}: {
  defaultColor: string;
  fontFamily?: string;
  fontSize?: number;
}): SyntaxHighlighterProps['renderer'] => {
  return ({ rows, stylesheet }) =>
    Platform.OS === 'android' ? (
      <AndroidNativeRenderer
        rows={rows}
        stylesheet={stylesheet}
        defaultColor={defaultColor}
        fontFamily={fontFamily}
        fontSize={13}
        lineHeight={9}
      />
    ) : (
      rows.map((node, i) =>
        createNativeElement({
          node,
          stylesheet,
          key: `code-segment-${i}`,
          defaultColor,
          fontFamily,
          fontSize,
        }),
      )
    );
};

const NativeSyntaxHighlighter = ({
  fontFamily = Platform.OS === 'ios' ? 'Courier' : 'Monospace',
  fontSize = DEFAULT_FONT_SIZE,
  children,
  highlighter = 'highlightjs',
  style = highlighter === 'prism' ? prismDefaultStyle : defaultStyle,
  PreTag = MarkdownReactiveScrollView,
  CodeTag = MarkdownReactiveScrollView,
  ...rest
}: PropsWithChildren<NativeSyntaxHighlighterProps>) => {
  const { transformedStyle, defaultColor } = useMemo(
    () =>
      generateNewStylesheet({
        stylesheet: style,
        highlighter,
      }),
    [highlighter, style],
  );
  const renderer = useMemo(
    () =>
      nativeRenderer({
        defaultColor: defaultColor as string,
        fontFamily,
        fontSize,
      }),
    [defaultColor, fontFamily, fontSize],
  );

  const Highlighter =
    highlighter === 'prism' ? SyntaxHighlighterPrism : SyntaxHighlighter;

  return (
    <Highlighter
      PreTag={PreTag}
      CodeTag={CodeTag}
      {...rest}
      style={transformedStyle as SyntaxHighlighterStylesheet}
      horizontal={true}
      renderer={renderer}
    >
      {children}
    </Highlighter>
  );
};

export default NativeSyntaxHighlighter;
