import { StreamChat, Channel, Message, MessageResponse } from "stream-chat";
import {
  StreamStorageConfig,
  CreateChannelOptions,
  SendMessageOptions,
  AISDKMessage,
  ChannelData,
} from "./types";
import { Readable } from "node:stream";
import { generateChannelId } from "./utils";

export class StreamStorage {
  private client: StreamChat;
  private botUserId: string;
  private adminUserId: string;

  constructor(config: StreamStorageConfig) {
    this.client = StreamChat.getInstance(config.apiKey, config.apiSecret);
    this.botUserId = config.botUserId || "ai-bot";
    this.adminUserId = config.adminUserId || "admin";
  }

  /**
   * Gets or creates a channel for AI conversations
   */
  async getOrCreateChannel(
    options: CreateChannelOptions
  ): Promise<Channel | null> {
    try {
      const channelId = options.channelId || generateChannelId();
      const members = options.members || [options.userId || this.botUserId];

      const channel = this.client.channel("messaging", channelId, {
        members,
        created_by_id: this.adminUserId,
        ...(options.channelName && { name: options.channelName }),
        ...options.metadata,
      });

      await channel.create();
      return channel;
    } catch (error) {
      console.error("Error creating channel:", error);
      return null;
    }
  }

  /**
   * Retrieves all channels for a specific user
   */
  async getChannels(userId: string): Promise<Channel[] | null> {
    try {
      const channels = await this.client.queryChannels({
        members: [userId, this.botUserId],
      });
      return channels;
    } catch (error) {
      console.error("Error fetching channels:", error);
      return null;
    }
  }

  /**
   * Sends a message to a specific channel
   */
  async sendMessage(
    channelId: string,
    options: SendMessageOptions
  ): Promise<any> {
    try {
      const channel = this.client.channel("messaging", channelId);

      const messageData: any = {
        text: options.text,
        user_id: options.userId,
        ...options.metadata,
      };

      if (options.attachments && options.attachments.length > 0) {
        messageData.attachments = options.attachments;
      }

      return await channel.sendMessage(messageData, { skip_enrich_url: true });
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * Sends an image to a channel
   */
  async sendImage(
    channelId: string,
    imageStream: Readable,
    filename: string,
    mediaType: string,
    userId: string
  ): Promise<any> {
    try {
      const channel = this.client.channel("messaging", channelId);
      return await channel.sendImage(imageStream as any, filename, mediaType, {
        id: userId,
      });
    } catch (error) {
      console.error("Error sending image:", error);
      throw error;
    }
  }

  /**
   * Converts AI SDK messages to Stream Chat format
   */
  convertAISDKMessages(messages: AISDKMessage[]): any[] {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.parts && { parts: message.parts }),
    }));
  }

  /**
   * Processes AI SDK message parts and handles file attachments
   */
  async processMessageParts(
    channelId: string,
    message: AISDKMessage,
    userId: string
  ): Promise<{
    text: string;
    attachments: any[];
    attachmentPromises: Array<{
      promise: Promise<any>;
      filename: string;
      type: string;
    }>;
  }> {
    let text = "";
    const attachmentPromises: Array<{
      promise: Promise<any>;
      filename: string;
      type: string;
    }> = [];

    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === "text") {
          text = part.text || "";
        }

        if (
          part.type === "file" &&
          part.url &&
          part.filename &&
          part.mediaType
        ) {
          // Convert data URL to readable stream
          const readableStream = this.dataUrlToReadable(part.url);
          // For now, we only support images because of the limitations of the Vercel's AI SDK.
          // it is possible to support other file types( but we need to wrap AI SDK's file type support )
          attachmentPromises.push({
            promise: this.sendImage(
              channelId,
              readableStream,
              part.filename,
              part.mediaType,
              userId
            ),
            filename: part.filename,
            type: part.mediaType,
          });
        }
      }
    } else {
      text = message.content;
    }

    // Wait for all attachment uploads to complete
    const uploadedAttachments = await Promise.all(
      attachmentPromises.map((attachment) => attachment.promise)
    );

    // Map uploaded attachments to the correct format
    const processedAttachments = uploadedAttachments.map(
      (attachment, index) => ({
        url: attachment.file,
        filename: attachmentPromises[index].filename,
        type: attachmentPromises[index].type,
      })
    );

    return {
      text,
      attachments: processedAttachments,
      attachmentPromises,
    };
  }

  /**
   * Converts data URL to readable stream
   */
  private dataUrlToReadable(dataUrl: string): Readable {
    const [meta, data] = dataUrl.split(",");
    if (!meta || !data) throw new Error("Invalid data URL");

    const isBase64 = meta.includes(";base64");

    const buffer = isBase64
      ? Buffer.from(data, "base64")
      : Buffer.from(decodeURIComponent(data), "utf8");

    return Readable.from(buffer);
  }

  /**
   * Gets channel data in a simplified format
   */
  getChannelData(channel: Channel): ChannelData {
    const data = channel.data || {};
    return {
      id: channel.id || "",
      name: (data as any).name,
      created_at: (data as any).created_at,
      updated_at: (data as any).updated_at,
      members: (data as any).members?.map(
        (member: any) => member.user_id || member.id
      ),
      metadata: data,
    };
  }

  /**
   * Retreives channel messages by channel id
   */
  async getChannelMessages(channelId: string): Promise<MessageResponse[]> {
    const channel = await this.client.channel("messaging", channelId).query();

    return channel.messages || [];
  }

  async upsertUsers(): Promise<string> {
    const id = generateChannelId();
    await this.client.upsertUsers([
      {
        id,
        role: "user",
      },
      {
        id: this.botUserId,
        role: "user",
      },
    ]);
    return id;
  }

  /**
   * Gets the Stream Chat client instance
   */
  getClient(): StreamChat {
    return this.client;
  }

  /**
   * Gets the bot user ID
   */
  getBotUserId(): string {
    return this.botUserId;
  }

  /**
   * Gets the admin user ID
   */
  getAdminUserId(): string {
    return this.adminUserId;
  }
}
