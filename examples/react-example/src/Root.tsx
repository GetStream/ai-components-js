// import { AIMarkdown } from '@stream-io/ai-components-react';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
} from 'stream-chat';
import {
  AIStateIndicator,
  Channel,
  ChannelList,
  Chat,
  useCreateChatClient,
  VirtualizedMessageList as MessageList,
  Window,
  type ChannelPreviewProps,
  ChannelPreview,
  useChannelStateContext,
  useChatContext,
  MessageInput,
  useMessageInputContext,
  useChannelActionContext,
  useMessageComposer,
} from 'stream-chat-react';

import { customAlphabet, nanoid } from 'nanoid';
import {
  use,
  useMemo,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
// import { useEffect } from 'react';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown as Record<string, string | null>;

const parseUserIdFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Token is missing');

  return JSON.parse(atob(payload))?.user_id;
};

const apiKey = params.key ?? (import.meta.env.VITE_STREAM_KEY as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);
const userId = parseUserIdFromToken(userToken);

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
  archived: false,
};
const options: ChannelOptions = { limit: 5, presence: true, state: true };
const sort: ChannelSort = { pinned_at: 1, last_message_at: -1, updated_at: -1 };

// @ts-ignore
const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

// const markdownContent = `
// # Welcome to AI Components!

// \`asddasd asdasd\`

// \`\`\`
// This is a code block
// \`\`\`
// `;

// TBD:
// - create Message component wrapping AIMarkdown
// - ensure styles are applied correctly
//

const FileInput = () => {
  const id = useMemo(() => `file-input-${nanoId()}`, []);

  return (
    <>
      <input
        name="files"
        multiple
        type="file"
        id={id}
        style={{ display: 'none' }}
      />
      <label style={{ display: 'flex' }} htmlFor={id} tabIndex={0}>
        <span className="material-symbols-rounded">add</span>
      </label>
    </>
  );
};

const AIMessageComposer = ({
  onSubmit,
}: Pick<ComponentPropsWithoutRef<'form'>, 'onSubmit'>) => {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        padding: '1rem',
        flexDirection: 'column',
        gap: '1rem',
        border: '1px solid #ccc',
        borderRadius: '1rem',
        maxWidth: '600px',
        flexGrow: 1,
      }}
    >
      <input
        style={{ all: 'unset' }}
        type="text"
        name="message"
        placeholder="Ask a question..."
      />
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <FileInput />
          <select
            style={{
              all: 'unset',
              display: 'flex',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '.5rem',
              padding: '0.25rem 1rem 0.25rem 0.25rem',
            }}
            name="model"
            defaultValue="gpt-4"
          >
            <option value="gpt-5">GPT-5</option>
            <option value="gpt-4">GPT-4</option>
          </select>
        </div>

        <button
          style={{
            all: 'unset',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="speech-to-text"
          type="button"
        >
          <span className="material-symbols-rounded">mic</span>
        </button>
      </div>
    </form>
  );
};

const InputComponent = () => {
  const { updateMessage, sendMessage } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const composer = useMessageComposer();

  return (
    <AIMessageComposer
      onSubmit={async (e) => {
        const event = e;
        const target = (event.currentTarget ??
          event.target) as HTMLFormElement | null;
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const t = formData.get('message');
        const model = formData.get('model');

        composer.textComposer.setText(t as string);

        const d = await composer.compose();

        if (!d) return;

        target?.reset();
        composer.clear();

        if (channel.initialized) {
          await sendMessage(d);
        } else {
          updateMessage(d?.localMessage);

          await channel.watch({ created_by_id: d.localMessage.user_id });

          // TODO: wrap in retry (in case channel creation takes longer)
          await fetch('http://localhost:3000/start-ai-agent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channel_id: channel.id,
              channel_type: channel.type,
              platform: 'openai',
              model: model,
            }),
          });

          await sendMessage(d);
        }
      }}
    />
  );
};

const CustomPreview = (p: ChannelPreviewProps) => {
  const { setActiveChannel } = useChatContext();
  return (
    <div onClick={() => setActiveChannel(p.channel)}>
      {/* @ts-expect-error */}
      {p.channel.data.summary ?? p.channel.id}
    </div>
  );
};

const EmptyPlaceholder = () => {
  // const

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        Start a conversation!
      </div>
    </div>
  );
};

const App = () => {
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  const channel = useMemo(() => {
    if (!chatClient) return undefined;

    return chatClient.channel('messaging', `ai-${nanoid()}`, {
      members: [chatClient.userID as string],
    });
  }, [chatClient]);

  if (!chatClient) return <>Loading...</>;

  return (
    <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
      <ChannelList
        setActiveChannelOnMount={false}
        Preview={(props) => (
          <ChannelPreview {...props} Preview={CustomPreview} />
        )}
        filters={filters}
        options={options}
        sort={sort}
      />
      <Channel
        channel={channel}
        initializeOnMount={false}
        EmptyPlaceholder={<EmptyPlaceholder />}
      >
        <Window>
          {/* <ChannelHeader Avatar={ChannelAvatar} /> */}
          <MessageList returnAllReadData />
          <AIStateIndicator />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <MessageInput Input={InputComponent} focus />
          </div>
        </Window>
      </Channel>
      {/* <InputComponent /> */}
    </Chat>
  );
};

export default App;
