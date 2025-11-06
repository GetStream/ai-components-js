import React, { type PropsWithChildren } from 'react';
import { Platform, Text } from 'react-native';

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

const DEFAULT_FONT_SIZE = 13;

// TODO: Just do useMemo, there's no real need for this type of caching.
const styleCache = new Map();

const generateNewStylesheet = ({
  stylesheet,
  highlighter,
}: {
  stylesheet: SyntaxHighlighterStylesheet;
  highlighter: NativeSyntaxHighlighterProps['highlighter'];
}) => {
  if (styleCache.has(stylesheet)) {
    return styleCache.get(stylesheet);
  }
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

  styleCache.set(stylesheet, { transformedStyle, defaultColor });
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
    rows.map((node, i) =>
      createNativeElement({
        node,
        stylesheet,
        key: `code-segment-${i}`,
        defaultColor,
        fontFamily,
        fontSize,
      }),
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
  const { transformedStyle, defaultColor } = generateNewStylesheet({
    stylesheet: style,
    highlighter,
  });
  const Highlighter =
    highlighter === 'prism' ? SyntaxHighlighterPrism : SyntaxHighlighter;
  return (
    <Highlighter
      PreTag={PreTag}
      CodeTag={CodeTag}
      {...rest}
      style={transformedStyle}
      horizontal={true}
      renderer={nativeRenderer({
        defaultColor,
        fontFamily,
        fontSize,
      })}
    >
      {children}
    </Highlighter>
  );
};

export default NativeSyntaxHighlighter;
