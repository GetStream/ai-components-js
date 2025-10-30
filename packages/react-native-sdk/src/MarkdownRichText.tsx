import {type PropsWithChildren, type ReactNode, useCallback, useMemo} from "react";
import {generateMarkdownText} from "./utils/generateMarkdownText";
import {Markdown, type MarkdownRules} from "./markdown";
import type {MarkdownStyle} from "./markdown/types.ts";
import {type GestureResponderEvent, Linking, Platform, Text, type TextProps, View, type ViewProps} from "react-native";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, { clamp, scrollTo, useAnimatedRef, useSharedValue } from 'react-native-reanimated';
import type {Output, SingleASTNode, State} from "@khanacademy/simple-markdown";

type ReactOutput = Output<React.ReactNode>

export const MarkdownReactiveScrollView = ({ children }: { children: ReactNode }) => {
    const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
    const contentWidth = useSharedValue(0);
    const visibleContentWidth = useSharedValue(0);
    const offsetBeforeScroll = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-5, 5])
        .onUpdate((event) => {
            const { translationX } = event;

            scrollTo(scrollViewRef, offsetBeforeScroll.value - translationX, 0, false);
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

const defaultMarkdownStyles: MarkdownStyle = {
    codeBlock: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'Monospace',
        fontWeight: '500',
        marginVertical: 8,
    },
    inlineCode: {
        fontSize: 13,
        padding: 3,
        paddingHorizontal: 5,
    },
    list: {
        marginBottom: 8,
        marginTop: 8,
    },
    listItemNumber: {
        fontWeight: 'bold',
    },
    listItemText: {
        flex: 0,
    },
    listRow: {
        flexDirection: 'row',
    },
    mentions: {
        fontWeight: '700',
    },
    paragraph: {
        marginBottom: 8,
        marginTop: 8,
    },
    paragraphCenter: {
        marginBottom: 8,
        marginTop: 8,
    },
    paragraphWithImage: {
        marginBottom: 8,
        marginTop: 8,
    },
    table: {
        borderRadius: 3,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    tableHeaderCell: {
        fontWeight: '500',
    },
    tableRow: {
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tableRowCell: {
        flex: 1,
    },
};

export const colors = {
    accent_blue: '#005FFF',
    accent_dark_blue: '#005DFF',
    accent_error: '#FF3842',
    accent_green: '#20E070',
    accent_info: '#1FE06F',
    accent_red: '#FF3742',
    bg_gradient_end: '#F7F7F7',
    bg_gradient_start: '#FCFCFC',
    bg_user: '#F7F7F8',
    black: '#000000',
    blue_alice: '#E9F2FF',
    border: '#00000014',
    code_block: '#DDDDDD',
    disabled: '#B4BBBA',
    grey: '#7A7A7A',
    grey_dark: '#72767E',
    grey_gainsboro: '#DBDBDB',
    grey_whisper: '#ECEBEB',
    icon_background: '#FFFFFF',
    label_bg_transparent: '#00000033',
    light_blue: '#E0F0FF',
    light_gray: '#E9EAED',
    modal_shadow: '#00000099',
    overlay: '#000000CC',
    shadow_icon: '#00000040',
    static_black: '#000000',
    static_white: '#ffffff',
    targetedMessageBackground: '#FBF4DD',
    text_high_emphasis: '#080707',
    text_low_emphasis: '#7E828B',
    transparent: 'transparent',
    white: '#FFFFFF',
    white_smoke: '#F2F2F2',
    white_snow: '#FCFCFC',
};

export const MarkdownRichText = ({ text, paragraphNumberOfLines, rules, styles: markdownStyles, onLink: onLinkParam }: { text: string, paragraphNumberOfLines?: number, rules?: MarkdownRules, styles?: MarkdownStyle, onLink?: (url: string) => void }) => {
    const markdownText = useMemo(() => generateMarkdownText(text), [text]);

    /**
     * =====================================================================
     */

    const styles: MarkdownStyle = {
        ...defaultMarkdownStyles,
        ...markdownStyles,
        autolink: {
            ...defaultMarkdownStyles.autolink,
            color: colors.accent_blue,
            ...markdownStyles?.autolink,
        },
        blockQuoteSection: {
            ...defaultMarkdownStyles.blockQuoteSection,
            flexDirection: 'row',
            padding: 8,
            ...markdownStyles?.blockQuoteSection,
        },
        blockQuoteSectionBar: {
            ...defaultMarkdownStyles.blockQuoteSectionBar,
            backgroundColor: colors.grey_gainsboro,
            marginRight: 8,
            width: 2,
            ...markdownStyles?.blockQuoteSectionBar,
        },
        blockQuoteText: {
            ...defaultMarkdownStyles.blockQuoteText,
            ...markdownStyles?.blockQuoteText,
        },
        codeBlock: {
            ...defaultMarkdownStyles.codeBlock,
            backgroundColor: colors.code_block,
            color: colors.black,
            padding: 8,
            ...markdownStyles?.codeBlock,
        },
        inlineCode: {
            ...defaultMarkdownStyles.inlineCode,
            backgroundColor: colors.white_smoke,
            borderColor: colors.grey_gainsboro,
            color: colors.accent_red,
            ...markdownStyles?.inlineCode,
        },
        mentions: {
            ...defaultMarkdownStyles.mentions,
            color: colors.accent_blue,
            ...markdownStyles?.mentions,
        },
        table: {
            ...defaultMarkdownStyles.table,
            borderColor: colors.grey_dark,
            marginVertical: 8,
            ...markdownStyles?.table,
        },
        tableHeader: {
            ...defaultMarkdownStyles.tableHeader,
            backgroundColor: colors.grey,
            ...markdownStyles?.tableHeader,
        },
        tableHeaderCell: {
            ...defaultMarkdownStyles.tableHeaderCell,
            padding: 5,
            ...markdownStyles?.tableHeaderCell,
        },
        tableRow: {
            ...defaultMarkdownStyles.tableRow,
            ...markdownStyles?.tableRow,
        },
        tableRowCell: {
            ...defaultMarkdownStyles.tableRowCell,
            borderColor: colors.grey_dark,
            padding: 5,
            ...markdownStyles?.tableRowCell,
        },
        tableRowLast: {
            ...markdownStyles?.tableRowLast,
        },
        text: {
            ...defaultMarkdownStyles.text,
            color: colors.black,
            ...markdownStyles?.text,
        },
    };

    const onLink = (url: string) =>
        onLinkParam
            ? onLinkParam(url)
            : Linking.canOpenURL(url).then((canOpenUrl) => canOpenUrl && Linking.openURL(url));

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
                    <Text key={state.key} numberOfLines={paragraphNumberOfLines} style={styles.paragraph}>
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
            <MarkdownTable node={node} output={output} state={state} styles={styles} />
        </MarkdownReactiveScrollView>
    );

    // @ts-ignore
    const blockQuoteReact = (node, output, state) => (
        <View key={state.key} style={styles.blockQuoteSection}>
            <View style={styles.blockQuoteSectionBar} />
            <View style={styles.blockQuoteText}>{output(node.content, state)}</View>
        </View>
    );

    const customRules = {
        blockQuote: {
            react: blockQuoteReact,
        },
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

    console.log('RULES: ', customRules)


    // @ts-ignore
    return <Markdown rules={{ ...customRules /*, ...rules */ }} styles={styles}>{markdownText}</Markdown>
}

export interface ListOutputProps {
    node: SingleASTNode;
    output: ReactOutput;
    state: State;
    styles?: Partial<MarkdownStyle>;
}

/**
 * For lists and sublists, the default behavior of the markdown library we use is
 * to always renumber any list, so all ordered lists start from 1.
 *
 * This custom rule overrides this behavior both for top level lists and sublists,
 * in order to start the numbering from the number of the first list item provided.
 */
export const ListOutput = ({ node, output, state, styles }: ListOutputProps) => {
    let isSublist = state.withinList;
    const parentTypes = ['text', 'paragraph', 'strong'];

    return (
        <View key={state.key} style={isSublist ? styles?.sublist : styles?.list}>
            {node.items.map((item: SingleASTNode, index: number) => {
                const indexAfterStart = node.start + index;

                if (item === null) {
                    return (
                        <ListRow key={index} style={styles?.listRow} testID='list-item'>
                            <Bullet
                                index={node.ordered && indexAfterStart}
                                style={node.ordered ? styles?.listItemNumber : styles?.listItemBullet}
                            />
                        </ListRow>
                    );
                }

                isSublist = item.length > 1 && item[1].type === 'list';
                const isSublistWithinText = parentTypes.includes((item[0] ?? {}).type) && isSublist;
                const style = isSublistWithinText ? { marginBottom: 0 } : {};

                return (
                    <ListRow key={index} style={styles?.listRow} testID='list-item'>
                        <Bullet
                            index={node.ordered && indexAfterStart}
                            style={node.ordered ? styles?.listItemNumber : styles?.listItemBullet}
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

interface BulletProps extends TextProps {
    index?: number;
}

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

export type MarkdownTableProps = {
    node: SingleASTNode;
    output: ReactOutput;
    state: State;
    styles: Partial<MarkdownStyle>;
};

const transpose = (matrix: SingleASTNode[][]) =>
    // TS gets confused because it considers the matrix to be potentially ragged,
    // while the markdown parser can never output a ragged matrix of AST nodes
    // when parsing a table. Hence, we use the forced type coercion.
    (matrix[0] ?? []).map((_, colIndex) => matrix.map((row) => row[colIndex]!));

const MarkdownTable = ({ node, output, state, styles }: MarkdownTableProps) => {
    const content = useMemo(() => {
        const nodeContent = [node?.header, ...(node?.cells ?? [])];
        return transpose(nodeContent);
    }, [node?.cells, node?.header]);
    const columns = content?.map((column, idx) => (
        <MarkdownTableColumn
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

export type MarkdownTableRowProps = {
    items: SingleASTNode[];
    output: ReactOutput;
    state: State;
    styles: Partial<MarkdownStyle>;
};

const MarkdownTableColumn = ({ items, output, state, styles }: MarkdownTableRowProps) => {
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
                    <Text style={styles.tableHeaderCell}>{output(headerCellContent, state)}</Text>
                </View>
            ) : null}
            {columnCellContents &&
                columnCellContents.map((content, idx) => (
                    <ColumnCell content={content} key={`cell-${idx}`} />
                ))}
        </View>
    );
};
