import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';
import { MarkdownReactiveScrollView } from '../../components';

export const CodeBlock = ({
  children,
  styles,
  state,
}: MarkdownComponentProps) => (
  <MarkdownReactiveScrollView key={state.key}>
    <Text style={styles.codeBlock}>{children}</Text>
  </MarkdownReactiveScrollView>
);

export const renderCodeBlock: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
}) => {
  return (
    <CodeBlock
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
    >
      {node.content?.trim()}
    </CodeBlock>
  );
};
