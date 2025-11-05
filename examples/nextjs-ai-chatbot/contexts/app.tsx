'use client';

import type {
  ReactNode} from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, usePathname } from 'next/navigation';
import type { UIMessage} from '@ai-sdk/react';
import { Chat, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { Chat as ChatType } from '@/types';
import { MODELS } from '@/utils/models';
import { generateChannelId } from '@stream-io/ai-sdk-storage/dist/utils';

const AppContext = createContext<any>(undefined);
type AppContextType = {
  chatID: string;
  chat: Chat<UIMessage>;
  messages: UIMessage[];
  sendMessage: (message: any) => Promise<any>;
  status: string;
  isLoadingMessages: boolean;
  loadChats: () => Promise<void>;
  chats: ChatType[];
  defaultModel: string;
  setDefaultModel: (model: string) => void;
  setReload: (reload: number) => void;
};

function AppProviderInner({ children }: { children: ReactNode }) {
  const { id } = useParams();
  const pathname = usePathname();
  const chatID = useMemo(() => (id as string) || generateChannelId(), [id]);
  const [loadedMessages, setLoadedMessages] = useState<UIMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [chats, setChats] = useState<ChatType[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [defaultModel, setDefaultModel] = useState<string>(MODELS[0].id);
  const modelRef = useRef(defaultModel);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    modelRef.current = defaultModel;
  }, [defaultModel]);

  const chat = useMemo(() => {
    return new Chat({
      transport: new DefaultChatTransport({
        api: '/api/chats',
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              messages,
              model: modelRef.current,
              id: chatID,
              user_id: localStorage.getItem('stream-user'),
            },
          };
        },
      }),
    });
  }, [chatID]);

  const loadChats = async () => {
    if (!userId) return;
    const response = await fetch(`/api/chats?user_id=${userId}`);
    const chats = await response.json();

    setChats(chats);
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const userId = localStorage.getItem('stream-user');

        if (!userId) {
          const response = await fetch('/api/users', { method: 'POST' });
          const userData = await response.json();
          localStorage.setItem('stream-user', userData.id);
          setUserId(userData.id);
        } else {
          setUserId(userId);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadChats();
    }
  }, [userId]);

  useEffect(() => {
    setLoadedMessages([]);
    setMessagesLoaded(false);

    if (chatID && id) {
      setIsLoadingMessages(true);
      fetch(`/api/chats/${chatID}`)
        .then((res) => res.json())
        .then((data) => {
          const messages = data.map((message: any) => ({
            id: message.id,
            role:
              message.user.id === 'ai-bot' ||
              message.message_type === 'agent_response'
                ? 'assistant'
                : 'user',
            parts: [
              {
                type: 'text',
                text: message.text,
              },
              //if message.attachemnts is not empty, add it to the parts
              ...(message.attachments?.length > 0
                ? message.attachments.map((attachemnt: any) => ({
                    type: 'file',
                    url: attachemnt.url,
                    filename: attachemnt.filename,
                    mediaType: attachemnt.type,
                  }))
                : []),
            ],
          }));
          setLoadedMessages(messages);
          setMessagesLoaded(true);
        })
        .catch((error) => {
          console.error('Error loading messages:', error);
          setMessagesLoaded(true);
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });
    } else if (!id) {
      setMessagesLoaded(true);
    }
  }, [chatID, id, pathname]);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatID,
    chat,
    onError: (error) => {
      console.error('Chat error for chatID:', chatID, error);
    },
  });

  useEffect(() => {
    if (setMessages) {
      setMessages([]);
    }
  }, [chatID, setMessages]);

  useEffect(() => {
    if (messagesLoaded && loadedMessages.length > 0) {
      setMessages(loadedMessages);
      setReload(reload + 1);
    }
  }, [messagesLoaded, loadedMessages, setMessages]);

  const contextValue: AppContextType = {
    chatID,
    chat,
    messages,
    sendMessage,
    status,
    isLoadingMessages,
    loadChats,
    chats,
    defaultModel,
    setDefaultModel,
    setReload,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return <AppProviderInner>{children}</AppProviderInner>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
