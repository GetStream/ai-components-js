import React, {
  Children,
  type ComponentProps,
  type ComponentType,
  type ElementType,
  isValidElement,
  useContext,
  useMemo,
} from 'react';
import ReactMarkdown, {
  type Components,
  type ExtraProps,
} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism, type SyntaxHighlighterProps } from 'react-syntax-highlighter';
import clsx from 'clsx';

const SyntaxHighlighter =
  Prism as unknown as ComponentType<SyntaxHighlighterProps>;

const getToolOrLanguage = (className: string = '') => {
  return className.match(/language-(?<tool>[\w-]+)/)?.groups?.['tool'];
};

type ToolComponents = Record<string, ComponentType<{ data: string }>>;
type MarkdownComponents = Components;

const AIMarkdownContext = React.createContext<{
  toolComponents: ToolComponents;
}>({ toolComponents: {} });

type BaseDefaultPreProps = ComponentProps<'pre'> & ExtraProps;

type DefaultPreProps = BaseDefaultPreProps & {
  Pre?: ComponentType<BaseDefaultPreProps> | ElementType;
};

const DefaultPre = (props: DefaultPreProps) => {
  const { children, Pre = 'pre', ...restProps } = props;

  const { toolComponents } = useContext(AIMarkdownContext);

  const [codeElement] = Children.toArray(children);

  if (
    !isValidElement(codeElement) ||
    codeElement.props.node.tagName !== 'code'
  ) {
    return <Pre {...restProps}>{children}</Pre>;
  }

  const tool = getToolOrLanguage(codeElement.props.className);

  // grab from pre-registered component set and render
  const Component = typeof tool === 'string' ? toolComponents[tool] : null;
  if (Component) {
    return <Component data={codeElement.props.children as string} />;
  }

  // render just a fragment with the code content
  // which gets replaced by SyntaxHighlighter (it itself renders pre too)
  if (tool) {
    return <>{children}</>;
  }

  // treat as regular pre/code block if there's no tool/language
  return <Pre {...restProps}>{children}</Pre>;
};

const DefaultSyntaxHighlighter = ({
  children,
  language,
}: BaseDefaultCodeProps) => {
  return (
    <SyntaxHighlighter
      codeTagProps={{
        className: clsx(
          { [`language-${language}`]: language },
          'aicr__syntax-highlighter',
        ),
      }}
      useInlineStyles={false}
      showLineNumbers
      language={language}
    >
      {children as string}
    </SyntaxHighlighter>
  );
};

type BaseDefaultCodeProps = ComponentProps<'code'> &
  ExtraProps & { language?: string; inline?: boolean };

type DefaultCodeProps = BaseDefaultCodeProps & {
  Code?: ComponentType<BaseDefaultCodeProps> | ElementType;
  SyntaxHighlighter?: ComponentType<BaseDefaultCodeProps>;
};

const DefaultCode = (props: DefaultCodeProps) => {
  const {
    node,
    className,
    children,
    SyntaxHighlighter = DefaultSyntaxHighlighter,
    Code = 'code',
    ...restProps
  } = props;

  const language = getToolOrLanguage(className);
  const inline = !language;

  const Component = inline ? Code : SyntaxHighlighter;

  return (
    <Component
      className={className}
      node={node}
      {...(typeof Component === 'string'
        ? {
            'data-inline': inline ? 'true' : 'false',
            'data-language': language,
          }
        : { inline, language })}
      {...restProps}
    >
      {children}
    </Component>
  );
};

const DefaultComponents = {
  pre: DefaultPre,
  code: DefaultCode,
} as const;

interface AIMarkdown {
  (props: {
    children: string;
    toolComponents?: ToolComponents;
    markdownComponents?: MarkdownComponents;
  }): JSX.Element;
  default: typeof DefaultComponents;
}

export const AIMarkdown: AIMarkdown = (props) => {
  const mergedMarkdownComponents: MarkdownComponents = useMemo(
    () => ({
      ...DefaultComponents,
      ...props.markdownComponents,
    }),
    [props.markdownComponents],
  );

  const mergedToolComponents: ToolComponents = useMemo(
    () => ({
      ...props.toolComponents,
      // ...DefaultTools,
    }),
    [props.toolComponents],
  );

  return (
    <AIMarkdownContext.Provider
      value={{ toolComponents: mergedToolComponents }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={mergedMarkdownComponents}
      >
        {props.children}
      </ReactMarkdown>
    </AIMarkdownContext.Provider>
  );
};

AIMarkdown.default = DefaultComponents;
