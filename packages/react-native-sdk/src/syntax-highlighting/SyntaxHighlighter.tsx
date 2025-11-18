import React, { type PropsWithChildren, useMemo } from 'react';
import { Platform, type ProcessedColorValue } from 'react-native';

import './prism-config';

import SyntaxHighlighter, {
  Prism as SyntaxHighlighterPrism,
  type SyntaxHighlighterProps,
} from 'react-syntax-highlighter';
import { defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { prism as prismDefaultStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  createNativeElement,
  DEFAULT_FONT_SIZE,
  flattenRowsToTextAndColorRanges,
  generateNewStylesheet,
} from './utils';
import type {
  NativeSyntaxHighlighterProps,
  SyntaxHighlighterStylesheet,
} from './types.ts';
import { MarkdownReactiveScrollView, PerfText } from '../components';

export type ColorRange = {
  start: number;
  end: number;
  color: ProcessedColorValue;
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
  const { text, ranges } = flattenRowsToTextAndColorRanges(rows, {
    stylesheet,
    defaultColor,
    fontFamily,
    fontSize,
  });

  return <PerfText text={text} ranges={ranges} lineHeight={9} fontSize={13} />;
};

const nativeRenderer = ({
  defaultColor,
  fontFamily,
  fontSize = 13,
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
        fontSize={fontSize}
        lineHeight={fontSize - 4}
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
