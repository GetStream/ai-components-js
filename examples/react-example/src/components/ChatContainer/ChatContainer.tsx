import {
  Channel,
  MessageList,
  Window,
  AIStateIndicator,
  MessageInput,
} from 'stream-chat-react';
import { EmptyState } from '../EmptyState';
import { MessageBubble } from '../MessageBubble';
import { MessageInputBar } from '../MessageInputBar';
import './ChatContainer.scss';

interface ChatContainerProps {
  onToggleSidebar: () => void;
}

export const ChatContainer = ({ onToggleSidebar }: ChatContainerProps) => {
  return (
    <div className="ai-demo-chat-container">
      {/* Mobile hamburger menu */}
      <button
        className="ai-demo-chat-container__hamburger"
        onClick={onToggleSidebar}
        type="button"
      >
        <span className="material-symbols-outlined">...</span>
      </button>

      <Channel
        initializeOnMount={false}
        EmptyPlaceholder={<EmptyState />}
        Message={MessageBubble}
      >
        <Window>
          <MessageList />
          <AIStateIndicator />
          <MessageInput Input={MessageInputBar} focus />
        </Window>
      </Channel>
    </div>
  );
};
