import {
  type PropsWithChildren,
  type ReactNode,
  useCallback,
  useMemo,
} from 'react';
import {
  type BulletProps,
  generateMarkdownText,
  type MarkdownOutputProps,
  type MarkdownTableRowProps,
} from './markdown';
import { Markdown } from './markdown';
import styles from './markdown/styles.ts';
import type { MarkdownRules, MarkdownStyle } from './markdown';
import {
  Linking,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  clamp,
  scrollTo,
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated';
import type { SingleASTNode, State } from '@khanacademy/simple-markdown';

export const MarkdownReactiveScrollView = ({
  children,
}: {
  children: ReactNode;
}) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const contentWidth = useSharedValue(0);
  const visibleContentWidth = useSharedValue(0);
  const offsetBeforeScroll = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .onUpdate((event) => {
      const { translationX } = event;

      scrollTo(
        scrollViewRef,
        offsetBeforeScroll.value - translationX,
        0,
        false,
      );
    })
    .onEnd((event) => {
      const { translationX } = event;

      const velocityEffect = event.velocityX * 0.3;

      const finalPosition = clamp(
        offsetBeforeScroll.value - translationX - velocityEffect,
        0,
        contentWidth.value - visibleContentWidth.value,
      );

      offsetBeforeScroll.value = finalPosition;

      scrollTo(scrollViewRef, finalPosition, 0, true);
    });

  return (
    <View style={{ width: '100%' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          horizontal
          nestedScrollEnabled={true}
          onContentSizeChange={(width) => {
            contentWidth.value = width;
          }}
          onLayout={(e) => {
            visibleContentWidth.value = e.nativeEvent.layout.width;
          }}
          ref={scrollViewRef}
          scrollEnabled={false}
        >
          {children}
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
};

export const MarkdownRichText = ({
  text,
  paragraphNumberOfLines,
  rules,
  styles: markdownStyles,
  onLink: onLinkParam,
}: {
  text: string;
  paragraphNumberOfLines?: number;
  rules?: MarkdownRules;
  styles?: MarkdownStyle;
  onLink?: (url: string) => void;
}) => {
  const markdownText = useMemo(() => generateMarkdownText(text), [text]);

  /**
   * =====================================================================
   */

  const onLink = (url: string) =>
    onLinkParam
      ? onLinkParam(url)
      : Linking.canOpenURL(url).then(
          (canOpenUrl) => canOpenUrl && Linking.openURL(url),
        );

  let previousLink: string | undefined;
  // @ts-ignore
  const linkReact = (node, output, { ...state }) => {
    let url: string;
    // Some long URLs with `&` separated parameters are trimmed and the url only until first param is taken.
    // This is done because of internal link been taken from the original URL in react-native-markdown-package. So, we check for `withinLink` and take the previous full URL.
    if (state?.withinLink && previousLink) {
      url = previousLink;
    } else {
      url = node.target;
      previousLink = node.target;
    }
    const onPress = () => onLink(url);

    return (
      <Text
        key={state.key}
        onPress={onPress}
        style={styles.autolink}
        suppressHighlighting={true}
      >
        {output(node.content, { ...state, withinLink: true })}
      </Text>
    );
  };

  // @ts-ignore
  const paragraphTextReact = (node, output, { ...state }) => {
    if (paragraphNumberOfLines !== undefined) {
      // If we want to truncate the message text, lets only truncate the first paragraph
      // and simply not render rest of the paragraphs.
      if (state.key === '0' || state.key === 0) {
        return (
          <Text
            key={state.key}
            numberOfLines={paragraphNumberOfLines}
            style={styles.paragraph}
          >
            {output(node.content, state)}
          </Text>
        );
      } else {
        return null;
      }
    }

    return (
      <Text key={state.key} style={styles.paragraph}>
        {output(node.content, state)}
      </Text>
    );
  };

  // take the @ mentions and turn them into markdown?
  // translate links
  // const { mentioned_users } = message;
  // const mentionedUsernames = (mentioned_users || [])
  //     .map((user) => user.name || user.id)
  //     .filter(Boolean)
  //     .sort((a, b) => b.length - a.length)
  //     .map(escapeRegExp);
  // const mentionedUsers = mentionedUsernames.map((username) => `@${username}`).join('|');
  // const regEx = new RegExp(`^\\B(${mentionedUsers})`, 'g');
  // const mentionsMatchFunction: MatchFunction = (source) => regEx.exec(source);
  //
  // const mentionsReact: ReactNodeOutput = (node, output, { ...state }) => {
  //     /**removes the @ prefix of username */
  //     const userName = node.content[0]?.content?.substring(1);
  //     const onPress = (event: GestureResponderEvent) => {
  //         if (!preventPress && onPressParam) {
  //             onPressParam({
  //                 additionalInfo: {
  //                     user: mentioned_users?.find((user: UserResponse) => userName === user.name),
  //                 },
  //                 emitter: 'textMention',
  //                 event,
  //             });
  //         }
  //     };
  //
  //     const onLongPress = (event: GestureResponderEvent) => {
  //         if (!preventPress && onLongPressParam) {
  //             onLongPressParam({
  //                 emitter: 'textMention',
  //                 event,
  //             });
  //         }
  //     };
  //
  //     return (
  //         <Text key={state.key} onLongPress={onLongPress} onPress={onPress} style={styles.mentions}>
  //             {Array.isArray(node.content)
  //                 ? node.content.reduce((acc, current) => acc + current.content, '') || ''
  //                 : output(node.content, state)}
  //         </Text>
  //     );
  // };

  // @ts-ignore
  const listReact = (node, output, state) => (
    <ListOutput
      key={`list-${state.key}`}
      node={node}
      output={output}
      state={state}
      styles={styles}
    />
  );

  // @ts-ignore
  const codeBlockReact = (node, _, state) => (
    <MarkdownReactiveScrollView key={state.key}>
      <Text style={styles.codeBlock}>{node?.content?.trim()}</Text>
    </MarkdownReactiveScrollView>
  );

  // @ts-ignore
  const tableReact = (node, output, state) => (
    <MarkdownReactiveScrollView key={state.key}>
      <MarkdownTable
        node={node}
        output={output}
        state={state}
        styles={styles}
      />
    </MarkdownReactiveScrollView>
  );

  const customRules = {
    // blockQuote: {
    //     react: blockQuoteReact,
    // },
    codeBlock: { react: codeBlockReact },
    // do not render images, we will scrape them out of the message and show on attachment card component
    image: { match: () => null },
    link: { react: linkReact },
    list: { react: listReact },
    // Truncate long text content in the message overlay
    paragraph: paragraphNumberOfLines ? { react: paragraphTextReact } : {},
    // we have no react rendering support for reflinks
    reflink: { match: () => null },
    sublist: { react: listReact },
    table: { react: tableReact },
  };

  /**
   * =====================================================================
   */

  // @ts-ignore
  return (
    <Markdown rules={{ ...customRules, ...rules }}>{markdownText}</Markdown>
  );
};

/**
 * For lists and sublists, the default behavior of the markdown library we use is
 * to always renumber any list, so all ordered lists start from 1.
 *
 * This custom rule overrides this behavior both for top level lists and sublists,
 * in order to start the numbering from the number of the first list item provided.
 */
export const ListOutput = ({
  node,
  output,
  state,
  styles,
}: MarkdownOutputProps) => {
  let isSublist = state.withinList;
  const parentTypes = ['text', 'paragraph', 'strong'];

  return (
    <View key={state.key} style={isSublist ? styles?.sublist : styles?.list}>
      {node.items.map((item: SingleASTNode, index: number) => {
        const indexAfterStart = node.start + index;

        if (item === null) {
          return (
            <ListRow key={index} style={styles?.listRow} testID="list-item">
              <Bullet
                index={node.ordered && indexAfterStart}
                style={
                  node.ordered ? styles?.listItemNumber : styles?.listItemBullet
                }
              />
            </ListRow>
          );
        }

        isSublist = item.length > 1 && item[1].type === 'list';
        const isSublistWithinText =
          parentTypes.includes((item[0] ?? {}).type) && isSublist;
        const style = isSublistWithinText ? { marginBottom: 0 } : {};

        return (
          <ListRow key={index} style={styles?.listRow} testID="list-item">
            <Bullet
              index={node.ordered && indexAfterStart}
              style={
                node.ordered ? styles?.listItemNumber : styles?.listItemBullet
              }
            />
            <ListItem key={1} style={[styles?.listItemText, style]}>
              {output(item, state)}
            </ListItem>
          </ListRow>
        );
      })}
    </View>
  );
};

const Bullet = ({ index, style }: BulletProps) => (
  <Text key={0} style={style}>
    {index ? `${index}. ` : '\u2022 '}
  </Text>
);

const ListRow = ({ children, style }: PropsWithChildren<ViewProps>) => (
  <View style={style}>{children}</View>
);

const ListItem = ({ children, style }: PropsWithChildren<TextProps>) => (
  <Text style={style}>{children}</Text>
);

const transpose = (matrix: SingleASTNode[][]) =>
  // TS gets confused because it considers the matrix to be potentially ragged,
  // while the markdown parser can never output a ragged matrix of AST nodes
  // when parsing a table. Hence, we use the forced type coercion.
  (matrix[0] ?? []).map((_, colIndex) => matrix.map((row) => row[colIndex]!));

const MarkdownTable = ({
  node,
  output,
  state,
  styles,
}: MarkdownOutputProps) => {
  const content = useMemo(() => {
    const nodeContent = [node?.header, ...(node?.cells ?? [])];
    return transpose(nodeContent);
  }, [node?.cells, node?.header]);
  const columns = content?.map((column, idx) => (
    <MarkdownTableColumn
      node={node}
      items={column}
      key={`column-${idx}`}
      output={output}
      state={state}
      styles={styles}
    />
  ));

  return (
    <View key={state.key} style={styles.table}>
      {columns}
    </View>
  );
};

const MarkdownTableColumn = ({
  items,
  output,
  state,
  styles,
}: MarkdownTableRowProps) => {
  const [headerCellContent, ...columnCellContents] = items;

  const ColumnCell = useCallback(
    ({ content }: { content: SingleASTNode }) =>
      content ? (
        <View style={styles.tableRow}>
          <View style={styles.tableRowCell}>{output(content, state)}</View>
        </View>
      ) : null,
    [output, state, styles],
  );

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {headerCellContent ? (
        <View key={-1} style={styles.tableHeader}>
          <Text style={styles.tableHeaderCell}>
            {output(headerCellContent, state)}
          </Text>
        </View>
      ) : null}
      {columnCellContents &&
        columnCellContents.map((content, idx) => (
          <ColumnCell content={content} key={`cell-${idx}`} />
        ))}
    </View>
  );
};
