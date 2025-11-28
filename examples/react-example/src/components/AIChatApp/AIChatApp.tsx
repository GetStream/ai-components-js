import { useState } from 'react';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
} from 'stream-chat';
import { Chat, useCreateChatClient } from 'stream-chat-react';
import { Sidebar } from '../Sidebar';
import { ChatContainer } from '../ChatContainer';
import './AIChatApp.scss';

interface AIChatAppProps {
  apiKey: string;
  userToken: string;
  userId: string;
  filters: ChannelFilters;
  options: ChannelOptions;
  sort: ChannelSort;
}

const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

export const AIChatApp = ({
  apiKey,
  userToken,
  userId,
  filters,
  options,
  sort,
}: AIChatAppProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  if (!chatClient) return <>Loading...</>;

  return (
    <div className="ai-demo-app">
      <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
        <Sidebar
          filters={filters}
          options={options}
          sort={sort}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
        <ChatContainer onToggleSidebar={toggleSidebar} />
      </Chat>
    </div>
  );
};
