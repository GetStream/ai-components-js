import {
  Platform,
  Pressable,
  type PressableProps,
  Text,
  View,
} from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';
import { MarkdownReactiveScrollView } from '../../components';
import SyntaxHighlighter from '../../syntax-highlighting/SyntaxHighlighter.tsx';
import React, { type PropsWithChildren, useCallback, useMemo } from 'react';
import ChartFromBlockXL from '../../charts/Chart.tsx';
import { VegaLiteSchema } from '../../charts/vega-lite/schema.ts';

export const CodeBlockCopyButton = ({
  onPress,
}: {
  onPress?: PressableProps['onPress'];
}) => (
  <Pressable
    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
    onPress={onPress}
  >
    <Text style={{ fontSize: 15 }}>{'\u29C9'}</Text>
  </Pressable>
);

// export const CodeBlockLineNumberGutter = ({ lineCount, styles }) => (
//   <View style={styles.codeBlockLineNumberGutter}>
//     {Array.from({ length: lineCount }, (_, i) => i).map((idx) => (
//       <Text style={styles.codeBlockLineNumberCell} key={idx}>
//         {`${idx + 1}.`}
//       </Text>
//     ))}
//   </View>
// );

export const CodeBlock = ({ styles, node }: MarkdownComponentProps) => {
  const text = useMemo(() => node.content?.trim(), [node.content]);
  // const lineCount = useMemo(() => text.split('\n').length ?? 0, [text]);

  const CodeTag = useCallback(
    ({ children }: PropsWithChildren) => (
      <View style={styles.codeBlockContainer}>
        {/*<CodeBlockLineNumberGutter lineCount={lineCount} styles={styles} />*/}
        <Text style={styles.codeBlock}>{children}</Text>
      </View>
    ),
    [styles],
  );

  const CodeBlockHeader = useCallback(
    () => (
      <View style={styles.codeBlockHeaderContainer}>
        <Text style={styles.codeBlockHeaderTitle}>{node.lang}</Text>
        <CodeBlockCopyButton />
      </View>
    ),
    [styles, node.lang],
  );

  const CodeBlockWrapper = useCallback(
    ({ children }: PropsWithChildren) => (
      <View style={styles.codeBlockWrapper}>
        <CodeBlockHeader />
        <MarkdownReactiveScrollView>{children}</MarkdownReactiveScrollView>
      </View>
    ),
    [CodeBlockHeader, styles.codeBlockWrapper],
  );

  if (node.lang === 'mermaid') {
    return <ChartFromBlockXL kind={'mermaid'} code={text} />;
  }

  if (node.lang === 'json') {
    try {
      const json = JSON.parse(text);
      const parsed = VegaLiteSchema.parse(json);
      if (parsed) {
        return <ChartFromBlockXL kind={parsed.archetype} spec={parsed} />;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <SyntaxHighlighter
      language={node.lang}
      highlighter={Platform.OS === 'android' ? 'prism' : 'prism'}
      CodeTag={CodeTag}
      PreTag={CodeBlockWrapper}
    >
      {text}
    </SyntaxHighlighter>
  );
};

export const renderCodeBlock: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => (
  <CodeBlock
    key={state.key}
    node={node}
    output={output}
    state={state}
    styles={styles}
  />
);
