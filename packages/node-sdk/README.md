# AI SDK Storage

A library that provides Stream Chat infrastructure integration for AI SDK, enabling persistent message storage and real-time chat functionality.

## Features

- 🚀 **Easy Integration**: Simple API for integrating with AI SDK
- 💬 **Stream Chat**: Built on Stream Chat infrastructure for real-time messaging
- 📁 **File Attachments**: Support for image and file uploads
- 🔧 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🛠️ **AI SDK Compatible**: Designed to work seamlessly with AI SDK's streaming APIs

## Installation

```bash
npm install @stream-io/ai-sdk-storage
```

## Quick Start

### 1. Basic Setup

```typescript
import { createStreamStorageClient } from "@stream-io/ai-sdk-storage";

const { streamStorage, aiSDKStreamStorage } = createStreamStorageClient({
  apiKey: "your-stream-api-key",
  apiSecret: "your-stream-api-secret",
  botUserId: "ai-bot", // optional, defaults to 'ai-bot'
  adminUserId: "admin", // optional, defaults to 'admin'
});
```

### 2. Environment Variables

```bash
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret
STREAM_BOT_USER_ID=ai-bot # optional
STREAM_ADMIN_USER_ID=admin # optional
```

```typescript
import { createConfigFromEnv } from "@stream-io/ai-sdk-storage";

const { streamStorage, aiSDKStreamStorage } = createStreamStorageClient(
  createConfigFromEnv()
);
```

## Usage Examples

### Basic Channel Management

```typescript
// Create a new channel
const channel = await streamStorage.getOrCreateChannel({
  userId: "user123",
  channelName: "Hi there",
  channelId: "optional-custom-id", // optional
});

// Get all channels for a user
const channels = await streamStorage.getChannels("user123");
```

### Sending Messages

```typescript
// Send a simple text message
await streamStorage.sendMessage("channel-id", {
  text: "Hello, world!",
  userId: "user123",
});

// Send a message with attachments
await streamStorage.sendMessage("channel-id", {
  text: "Check out this image!",
  userId: "user123",
  attachments: [
    {
      url: "https://example.com/image.jpg",
      filename: "image.jpg",
      type: "image/jpeg",
    },
  ],
});
```

### AI SDK Integration

```typescript
import { streamText } from "ai";
import { AISDKStreamStorage } from "@stream-io/ai-sdk-storage";

// Create AI SDK Stream Storage instance
const aiSDKStorage = new AISDKStreamStorage(streamStorage);

// Handle AI SDK streaming with Stream Chat integration
const result = streamText({
  model: yourModel,
  messages: convertToModelMessages(messages),
  onFinish: async (responseMessage) => {
    // Process AI response and send to Stream Chat
    await aiSDKStorage.processAIResponse("channel-id", responseMessage);
  },
});

// Process user message with attachments
const { processUserMessage } = await aiSDKStorage.handleStreamText(
  "channel-id",
  messages,
  userId,
  async (responseMessage) => {
    await aiSDKStorage.processAIResponse("channel-id", responseMessage);
  }
);

await processUserMessage();
```

### Complete Next.js API Route Example

```typescript
import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import {
  createStreamStorageClient,
  createConfigFromEnv,
} from "@stream-io/ai-sdk-storage";

export async function POST(req: NextRequest) {
  const { messages, channelId, userId, channelName } = await req.json();

  const { streamStorage, aiSDKStreamStorage } = createStreamStorageClient(
    createConfigFromEnv()
  );

  const { processUserMessage, processAIResponse } =
    await storage.aiSDKStreamStorage.handleStreamText(
      id,
      messages,
      user_id,
      async (responseMessage) => {
        await storage.aiSDKStreamStorage.processAIResponse(id, responseMessage);
      }
    );

  await processUserMessage();
  // Stream AI response
  const result = streamText({
    model: yourModel,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ responseMessage }) => {
      await processAIResponse(responseMessage);
    },
    onError: (error) => {
      console.error(error, "error");
      return "Error: " + error;
    },
  });
}
```

## API Reference

### StreamStorage

The main class for Stream Chat operations.

#### Methods

- `createChannel(options: CreateChannelOptions): Promise<Channel | null>`
- `getChannels(userId: string): Promise<Channel[] | null>`
- `sendMessage(channelId: string, options: SendMessageOptions): Promise<any>`
- `sendImage(channelId: string, imageStream: ReadableStream, filename: string, mediaType: string, userId: string): Promise<any>`
- `processMessageParts(channelId: string, message: AISDKMessage, userId: string): Promise<ProcessedMessage>`
- `getChannelData(channel: Channel): ChannelData`
- `getChannelMessages(channelId: string): Promise<MessageResponse[]>`

### AISDKStreamStorage

Helper class for AI SDK integration.

#### Methods

- `handleStreamText(channelId: string, messages: AISDKMessage[], userId: string, onFinish: Function): Promise<StreamHandlers>`
- `processAIResponse(channelId: string, responseMessage: any): Promise<void>`
- `createChannelForAI(userId: string, channelName?: string, channelId?: string): Promise<Channel | null>`
- `getUserChannels(userId: string): Promise<ChannelData[]>`
- `generateChannelId(): string`

## Types

```typescript
interface StreamStorageConfig {
  apiKey: string;
  apiSecret: string;
  botUserId?: string;
  adminUserId?: string;
}

interface CreateChannelOptions {
  channelId?: string;
  channelName?: string;
  userId: string;
  members?: string[];
  metadata?: Record<string, any>;
}

interface AISDKMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: Array<{
    type: "text" | "file";
    text?: string;
    url?: string;
    filename?: string;
    mediaType?: string;
  }>;
}
```

## Error Handling

The library includes comprehensive error handling:

```typescript
try {
  const channel = await streamStorage.getOrCreateChannel({
    userId: "user123",
    channelName: "Hi there",
  });

  if (!channel) {
    console.error("Failed to create channel");
    return;
  }

  // Use channel...
} catch (error) {
  console.error("Error:", error);
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@getstream.io.
