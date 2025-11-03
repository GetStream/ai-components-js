import type { StreamStorage } from './storage';
import type { AISDKMessage, SendMessageOptions } from './types';

/**
 * AI SDK integration helpers for Stream Storage
 */
export class AISDKStreamStorage {
  private streamStorage: StreamStorage;

  constructor(streamStorage: StreamStorage) {
    this.streamStorage = streamStorage;
  }

  /**
   * Handles AI SDK message streaming with Stream Chat integration
   */
  async handleStreamText(
    channelId: string,
    messages: AISDKMessage[],
    userId: string,
    onFinish: (responseMessage: any) => Promise<void>,
  ): Promise<{
    processUserMessage: () => Promise<void>;
    processAIResponse: (responseMessage: any) => Promise<void>;
  }> {
    const lastMessage = messages[messages.length - 1];
    const userMessageUserId =
      lastMessage.role === 'user' ? userId : this.streamStorage.getBotUserId();
    const channel = await this.streamStorage.getOrCreateChannel({
      userId,
      channelId,
      channelName: lastMessage.parts?.find((part) => part.type === 'text')
        ?.text,
      members: [userId, this.streamStorage.getBotUserId()],
    });
    if (!channel) {
      throw new Error('Failed to create channel');
    }
    // Process user message with attachments
    const processUserMessage = async () => {
      if (lastMessage.role === 'user') {
        const { text, attachments } =
          await this.streamStorage.processMessageParts(
            channelId,
            lastMessage,
            userMessageUserId,
          );

        if (text || attachments.length > 0) {
          const messageOptions: SendMessageOptions = {
            text,
            userId: userMessageUserId,
            ...(attachments.length > 0 && { attachments }),
          };
          await this.streamStorage.sendMessage(channelId, messageOptions);
        }
      }
    };

    // Process AI response
    const processAIResponse = async (responseMessage: any) => {
      await onFinish(responseMessage);
    };

    return {
      processUserMessage,
      processAIResponse,
    };
  }

  /**
   * Processes AI response message and sends to Stream Chat
   */
  async processAIResponse(
    channelId: string,
    responseMessage: any,
  ): Promise<void> {
    // Extract text content from AI response
    const textParts = responseMessage.parts?.filter((part: any) => {
      return part.type === 'text' && part.state === 'done';
    });

    if (textParts && textParts.length > 0) {
      const text = textParts[0].text;
      if (text && text.length > 0) {
        await this.streamStorage.sendMessage(channelId, {
          text,
          userId: this.streamStorage.getBotUserId(),
          metadata: {
            message_type: 'agent_response',
          },
        });
      }
    }

    // Extract tool outputs from AI response
    const toolParts = responseMessage.parts?.filter((part: any) => {
      return (
        part.type?.startsWith('tool-') && part.state === 'output-available'
      );
    });

    if (toolParts && toolParts.length > 0) {
      const toolOutput = toolParts[0].output;
      if (toolOutput) {
        const toolName = toolParts[0].type.replace('tool-', '');
        await this.streamStorage.sendMessage(channelId, {
          text: `\`\`\`ai-tool-${toolName}\n${JSON.stringify(
            toolOutput,
          )}\n\`\`\``,
          userId: this.streamStorage.getBotUserId(),
          metadata: {
            message_type: 'agent_response',
          },
        });
      }
    }
  }

  /**
   * Creates a channel and handles the initial setup
   */
  async createChannelForAI(
    userId: string,
    channelName?: string,
    channelId?: string,
  ) {
    return await this.streamStorage.getOrCreateChannel({
      userId,
      channelName,
      channelId,
    });
  }

  /**
   * Gets all channels for a user
   */
  async getUserChannels(userId: string) {
    const channels = await this.streamStorage.getChannels(userId);
    return (
      channels?.map((channel) => this.streamStorage.getChannelData(channel)) ||
      []
    );
  }
}
