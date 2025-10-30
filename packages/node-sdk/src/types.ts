import type { Channel, StreamChat } from 'stream-chat';

export interface StreamStorageConfig {
  apiKey: string;
  apiSecret: string;
  botUserId?: string;
  adminUserId?: string;
}

export interface CreateChannelOptions {
  channelId?: string;
  channelName?: string;
  userId: string;
  members?: string[];
  metadata?: Record<string, any>;
}

export interface MessageAttachment {
  url: string;
  filename: string;
  type: string;
}

export interface SendMessageOptions {
  text: string;
  userId: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
}

export interface AISDKMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: Array<{
    type: 'text' | 'file';
    text?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
  }>;
}

export interface StreamStorageClient {
  client: StreamChat;
  createChannel: (options: CreateChannelOptions) => Promise<Channel | null>;
  getChannels: (userId: string) => Promise<Channel[] | null>;
  sendMessage: (channelId: string, options: SendMessageOptions) => Promise<any>;
  convertAISDKMessages: (messages: AISDKMessage[]) => any[];
  generateChannelId: () => string;
}

export interface ChannelData {
  id: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  members?: string[];
  metadata?: Record<string, any>;
}
