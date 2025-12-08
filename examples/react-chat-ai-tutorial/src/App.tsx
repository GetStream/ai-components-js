import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  useCreateChatClient,
  ChannelList,
  Window,
  MessageInput,
  useChatContext,
} from 'stream-chat-react';
import { Composer } from './components/Composer';
import { MessageBubble } from './components/MessageBubble';
import { AIStateIndicator } from './components/AIStateIndicator';
import { useEffect } from 'react';
import { nanoid } from 'nanoid';
import { ChannelListItem } from './components/ChannelListItem';

const userToken = import.meta.env.VITE_STREAM_USER_TOKEN;
const apiKey = import.meta.env.VITE_STREAM_API_KEY;

if (typeof apiKey !== 'string' || !apiKey.length) {
  throw new Error('Missing VITE_STREAM_API_KEY');
}

if (typeof userToken !== 'string' || !userToken.length) {
  throw new Error('Missing VITE_STREAM_USER_TOKEN');
}

const userIdFromToken = (token: string) => {
  const [, payload] = token.split('.');
  const parsedPayload = JSON.parse(atob(payload));
  return parsedPayload.user_id as string;
};

const userId = userIdFromToken(userToken!);

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
  archived: false,
};
const options: ChannelOptions = { limit: 5 };
const sort: ChannelSort = { pinned_at: 1, last_message_at: -1, updated_at: -1 };

const ChatContent = () => {
  const { setActiveChannel, client, channel } = useChatContext();

  useEffect(() => {
    if (!channel) {
      setActiveChannel(
        client.channel('messaging', `ai-${nanoid()}`, {
          members: [client.userID as string],
          // @ts-expect-error fix - this is a hack that allows a custom upload function to run
          own_capabilities: ['upload-file'],
        }),
      );
    }
  }, [channel]);

  return (
    <>
      <ChannelList
        Preview={ChannelListItem}
        setActiveChannelOnMount={false}
        filters={filters}
        sort={sort}
        options={options}
      />
      <Channel initializeOnMount={false} Message={MessageBubble}>
        <Window>
          <MessageList />
          <AIStateIndicator />
          <MessageInput Input={Composer} />
        </Window>
      </Channel>
    </>
  );
};

function App() {
  const chatClient = useCreateChatClient({
    apiKey: apiKey!,
    tokenOrProvider: userToken!,
    userData: {
      id: userId,
    },
  });

  if (!chatClient) {
    return <div>Loading chat...</div>;
  }

  return (
    <Chat client={chatClient}>
      <ChatContent />
    </Chat>
  );
}

export default App;
