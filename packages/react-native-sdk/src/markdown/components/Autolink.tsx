import { Text } from 'react-native';
import type { MarkdownComponentProps, RuleRenderFunction } from '../types.ts';

export const Autolink = ({
  children,
  styles,
  onPress,
}: MarkdownComponentProps) => (
  <Text style={styles.autolink} onPress={onPress}>
    {children}
  </Text>
);

export const renderAutolink: RuleRenderFunction = ({
  node,
  output,
  state,
  styles,
  onPress,
}) => {
  state.withinText = true;
  const onLinkPress = () => onPress && onPress(node.target);
  return (
    <Autolink
      key={state.key}
      node={node}
      output={output}
      state={state}
      styles={styles}
      onPress={onLinkPress}
    >
      {output(node.content, state)}
    </Autolink>
  );
};
