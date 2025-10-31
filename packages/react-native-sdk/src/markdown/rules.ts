import React from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import type {
  MatchFunction,
  Output,
  OutputRules,
  ParseFunction,
  Parser,
  ReactOutputRule,
  SingleASTNode,
} from '@khanacademy/simple-markdown';
import SimpleMarkdown from '@khanacademy/simple-markdown';
import { head, includes, map } from 'lodash';

import type {
  ListNode,
  MarkdownOptions,
  MarkdownState,
  MarkdownStyle,
  NodeWithContent,
  NodeWithStringContent,
  RuleRenderFunction,
  RuleRenderFunctionEnrichedProps,
  TableNode,
} from './types';
import { renderBlockQuote } from './components';
import { renderAutolink } from './components/Autolink.tsx';
import { renderUrl } from './components/Url.tsx';
import { renderLink } from './components/Link.tsx';
import { renderLineBreak } from './components/LineBreak.tsx';
import { renderStrikethrough } from './components/Strikethrough.tsx';
import { renderEmphasis } from './components/Emphasis.tsx';
import { renderHeading } from './components/Heading.tsx';
import { renderBold } from './components/Bold.tsx';
import { renderHorizontalRule } from './components/HorizontalRule.tsx';
import { renderNewLine } from './components/NewLine.tsx';
import { renderMailto } from './components/Mailto.tsx';
import { renderParagraph } from './components/Paragraph.tsx';
import { renderText } from './components/Text.tsx';
import { renderList } from './components/List.tsx';
import { renderCodeBlock } from './components/CodeBlock.tsx';
import { renderInlineCode } from './components/InlineCode.tsx';

const LINK_INSIDE = '(?:\\[(?:\\\\.|[^\\\\\\[\\]])*\\]|\\\\.|[^\\[\\]\\\\])*';
/**
 * Href + optional title (escape-aware). Group 1 === href (angle or bare).
 * The title is in groups 2, 3 or 4.
 */
const LINK_HREF_AND_TITLE =
  '\\s*<?([^\\s>]*?)>?\\s*' + // 1: href
  '(?:' +
  '\\\\"((?:\\\\.|[^"\\\\])*)\\\\"' + // 2: "title"
  "|\\\\'((?:\\\\.|[^'\\\\])*)\\\\'" + // 3: 'title'
  '|\\(((?:\\\\.|[^)\\\\])*)\\)' + // 4: (title)
  ')?\\s*';

const LINK_REGEX = new RegExp(
  '^\\[(' + LINK_INSIDE + ')\\]\\(' + LINK_HREF_AND_TITLE + '\\)',
);

export const getLocalRules = (
  styles: MarkdownStyle,
  opts: MarkdownOptions = {},
): OutputRules<ReactOutputRule> => {
  const { onLink, paragraphNumberOfLines } = opts;
  const openLinkHandler = (target: string) => {
    if (onLink) {
      // user-supplied handler may be async; we keep your behavior
      Promise.resolve(onLink(target)).catch((error: unknown) => {
        const msg =
          error && typeof error === 'object' && 'toString' in error
            ? String(error)
            : 'Unknown error';

        console.log('There has been a problem with this action. ' + msg);
        throw error;
      });
    }
  };

  const parseInline = function (
    parse: Parser,
    content: string,
    state: MarkdownState,
  ): SingleASTNode[] {
    const isCurrentlyInline = state.inline || false;
    state.inline = true;
    const result = parse(content, state);
    state.inline = isCurrentlyInline;
    return result;
  };

  const parseCaptureInline: ParseFunction = (capture, parse, state) => {
    return {
      content: parseInline(parse, capture[2] as string, state as MarkdownState),
    };
  };

  const enrichedRenderFunction =
    (
      render: RuleRenderFunction,
      options: Partial<RuleRenderFunctionEnrichedProps> = {},
    ) =>
    (
      node: SingleASTNode,
      output: Output<React.ReactNode>,
      { ...state }: MarkdownState,
    ) =>
      render({ node, output, state, styles, ...options });

  return {
    autolink: {
      react: enrichedRenderFunction(renderAutolink, {
        onLink: openLinkHandler,
      }),
    },
    blockQuote: {
      react: enrichedRenderFunction(renderBlockQuote),
    },
    br: {
      react: enrichedRenderFunction(renderLineBreak),
    },
    codeBlock: {
      react: enrichedRenderFunction(renderCodeBlock),
    },
    del: {
      react: enrichedRenderFunction(renderStrikethrough),
    },
    em: {
      react: enrichedRenderFunction(renderEmphasis),
    },
    heading: {
      match: SimpleMarkdown.blockRegex(/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n *)+/),
      react: enrichedRenderFunction(renderHeading),
    },
    hr: {
      react: enrichedRenderFunction(renderHorizontalRule),
    },
    image: {
      // We intentionally disable parsing images; keep the shape
      match: () => null,
    },
    inlineCode: {
      parse: parseCaptureInline,
      react: enrichedRenderFunction(renderInlineCode),
    },
    link: {
      match: SimpleMarkdown.inlineRegex(LINK_REGEX) as MatchFunction,
      react: enrichedRenderFunction(renderLink, {
        onLink: openLinkHandler,
      }),
    },
    list: {
      react: enrichedRenderFunction(renderList),
    },
    mailto: {
      react: enrichedRenderFunction(renderMailto, {
        onLink: openLinkHandler,
      }),
    },
    newline: {
      react: enrichedRenderFunction(renderNewLine),
    },
    paragraph: {
      react: enrichedRenderFunction(renderParagraph, {
        paragraphNumberOfLines,
      }),
    },
    strong: {
      react: enrichedRenderFunction(renderBold),
    },
    sublist: {
      react: enrichedRenderFunction(renderList),
    },
    table: {
      react(
        node: SingleASTNode,
        output: Output<React.ReactNode>,
        { ...state }: MarkdownState,
      ) {
        const n = node as TableNode;

        const headers = map(n.header, (content, i) =>
          React.createElement(
            Text,
            {
              key: i,
              style: styles.tableHeaderCell,
            },
            output(content, state),
          ),
        );

        const header = React.createElement(
          View,
          { key: -1, style: styles.tableHeader },
          headers,
        );

        const rows = map(n.cells, (row, r) => {
          const cells = map(row, (content, c) =>
            React.createElement(
              View,
              {
                key: c,
                style: styles.tableRowCell,
              },
              output(content, state),
            ),
          );
          const rowStyles: (TextStyle | ViewStyle | undefined)[] = [
            styles.tableRow,
          ];
          if (n.cells.length - 1 === r) {
            rowStyles.push(styles.tableRowLast);
          }
          return React.createElement(View, { key: r, style: rowStyles }, cells);
        });

        return React.createElement(
          View,
          { key: state.key, style: styles.table },
          [header, rows],
        );
      },
    },
    text: {
      react: enrichedRenderFunction(renderText),
    },
    u: {
      // no support for underlines yet
      match: () => null,
    },
    url: {
      react: enrichedRenderFunction(renderUrl, {
        onLink: openLinkHandler,
      }),
    },
    // no support for reflinks
    reflink: { match: () => null },
  } as unknown as OutputRules<ReactOutputRule>;
};
