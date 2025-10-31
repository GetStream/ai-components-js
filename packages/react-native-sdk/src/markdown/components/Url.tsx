import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';

export const Url = ({ children, styles, onPress }: MarkdownComponentProps) => (
  <Text style={styles.url} onPress={onPress}>
    {children}
  </Text>
);

export const renderUrl: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
  onPress,
}) => {
  state.withinText = true;
  const onLinkPress = () => onPress && onPress(node.target);
  return (
    <Url
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
      onPress={onLinkPress}
    >
      {output(node.content, state)}
    </Url>
  );
};
