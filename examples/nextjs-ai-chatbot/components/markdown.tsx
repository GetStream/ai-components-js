"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import Weather from "./tools/weather";

export const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    p: ({ children }: { children: string }) => {
      return <div className="no-prose">{children}</div>;
    },
    pre: ({ children, ...props }: any) => {
      const codeElement = React.Children.only(children);
      if (codeElement?.props?.className?.includes("language-ai-tool-weather")) {
        return <Weather data={codeElement.props.children} />;
      }
      return <pre {...props}>{children}</pre>;
    },
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter language={match[1]} style={dark}>
          {children}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} text-sm py-0.5 px-1 rounded`} {...props}>
          {children}
        </code>
      );
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal list-inside ml-4" {...props}>
          {children}
        </ol>
      );
    },
    li: ({ node, children, ...props }: any) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      );
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="list-decimal list-inside ml-4" {...props}>
          {children}
        </ul>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components as any}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
