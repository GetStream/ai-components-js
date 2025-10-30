import truncate from 'lodash/truncate';

import { find } from 'linkifyjs';
import type { LinkInfo } from '../index.tsx';

export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,/\\^$|#]/g, '\\$&');
}

/**
 * This is done to remove all markdown formatted links.
 * eg: [google.com](https://www.google.com), [Google](https://www.google.com), [https://www.google.com](https://www.google.com)
 * */
const removeMarkdownLinksFromText = (input: string) =>
  input.replace(/\[.*\]\(.*\)/g, '');

/**
 * This is done to avoid parsing usernames with dot as well as an email address in it.
 */
const removeUserNamesWithEmailFromText = (input: string) =>
  input.replace(/@(\w+(\.\w+)?)(@\w+\.\w+)/g, '');

export const parseLinksFromText = (input?: string): LinkInfo[] => {
  if (!input) {
    return [];
  }
  const strippedInput = [
    removeMarkdownLinksFromText,
    removeUserNamesWithEmailFromText,
  ].reduce((acc, fn) => fn(acc), input);

  const links = find(strippedInput, 'url');
  const emails = find(strippedInput, 'email');

  const result: LinkInfo[] = [...links, ...emails].map(({ href, value }) => {
    let hrefWithProtocol = href;
    // Matching these: https://reactnative.dev/docs/0.73/linking?syntax=ios#built-in-url-schemes
    const pattern = new RegExp(/^(mailto:|tel:|sms:|\S+:\/\/)/);
    if (!pattern.test(hrefWithProtocol)) {
      hrefWithProtocol = 'http://' + hrefWithProtocol;
    }

    return {
      raw: value,
      url: hrefWithProtocol,
    };
  });

  return result;
};

export const generateMarkdownText = (text?: string) => {
  if (!text) {
    return null;
  }

  // Trim the extra spaces from the text.
  let resultText = text.trim();

  // List of all the links present in the text.
  const linkInfos = parseLinksFromText(resultText);

  for (const linkInfo of linkInfos) {
    const displayLink = truncate(linkInfo.raw, {
      length: 200,
      omission: '...',
    });
    // Convert raw links/emails in the text to respective markdown syntax.
    // Eg: Hi @getstream.io -> Hi @[getstream.io](getstream.io).
    const normalRegEx = new RegExp(escapeRegExp(linkInfo.raw), 'g');
    const markdown = `[${displayLink}](${linkInfo.url})`;
    resultText = text.replace(normalRegEx, markdown);

    // After previous step, in some cases, the mentioned user after `@` might have a link/email so we convert it back to normal raw text.
    // Eg: Hi, @[test.user@gmail.com](mailto:test.user@gmail.com) to @test.user@gmail.com.
    const mentionsRegex = new RegExp(
      `@\\[${escapeRegExp(displayLink)}\\]\\(${escapeRegExp(linkInfo.url)}\\)`,
      'g',
    );
    resultText = resultText.replace(mentionsRegex, `@${displayLink}`);
  }

  // Escape the " and ' characters, except in code blocks where we deem this allowed.
  resultText = resultText.replace(
    /(```[\s\S]*?```|`.*?`)|[<"']/g,
    (match, code) => {
      if (code) {
        return code;
      }
      return `\\${match}`;
    },
  );

  // Remove whitespaces that come directly after newlines except in code blocks where we deem this allowed.
  resultText = resultText.replace(
    /(```[\s\S]*?```|`.*?`)|\n[ ]{2,}/g,
    (_, code) => {
      if (code) {
        return code;
      }
      return '\n';
    },
  );

  // Always replace \n``` with \n\n``` to force the markdown state machine to treat it as a separate block. Otherwise, code blocks inside of list
  // items for example were broken. We clean up the code block closing state within the rendering itself.
  resultText = resultText.replace(/\n```/g, '\n\n```');

  return resultText;
};
