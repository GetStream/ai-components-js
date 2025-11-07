import { Pressable, type PressableProps, Text, View } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';
import { MarkdownReactiveScrollView } from '../../components';
import SyntaxHighlighter from '../../syntax-highlighting/SyntaxHighlighter.tsx';
import { type PropsWithChildren, useCallback, useMemo } from 'react';
import ChartFromBlockXL from '../../charts/Chart.tsx';

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

export const CodeBlock = ({ styles, node }: MarkdownComponentProps) => {
  const text = useMemo(() => node.content?.trim(), [node.content]);
  const lineNumbers = useMemo(
    () => Array.from({ length: text?.split('\n').length ?? 0 }, (_, i) => i),
    [text],
  );

  const CodeTag = useCallback(
    ({ children }: PropsWithChildren) => (
      <View style={styles.codeBlockContainer}>
        <View style={styles.codeBlockLineNumberGutter}>
          {lineNumbers.map((idx) => (
            <Text style={styles.codeBlockLineNumberCell} key={idx}>
              {`${idx + 1}.`}
            </Text>
          ))}
        </View>
        <Text style={styles.codeBlock}>{children}</Text>
      </View>
    ),
    [styles, lineNumbers],
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
    const parsed = JSON.parse(text);
    if (parsed && parsed.$schema.includes('vega-lite')) {
      return <ChartFromBlockXL kind={'vegalite'} spec={parsed} />;
    }
  }

  return (
    <SyntaxHighlighter
      language={node.lang}
      highlighter={'prism'}
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
