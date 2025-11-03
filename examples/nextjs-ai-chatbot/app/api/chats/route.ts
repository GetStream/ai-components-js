import { convertToModelMessages, streamText } from 'ai';
import { NextResponse } from 'next/server';
import { GetModel, MODELS } from '@/utils/models';
import { createStreamStorageClient } from '@stream-io/ai-sdk-storage';
import { createConfigFromEnv } from '@stream-io/ai-sdk-storage/dist/utils';
import { tools } from '@/utils/tools';

const storage = createStreamStorageClient(createConfigFromEnv());

export async function POST(req: Request) {
  const { messages, id, user_id, model = MODELS[0].id } = await req.json();

  const { processUserMessage, processAIResponse } =
    await storage.aiSDKStreamStorage.handleStreamText(
      id,
      messages,
      user_id,
      async (responseMessage) => {
        await storage.aiSDKStreamStorage.processAIResponse(id, responseMessage);
      },
    );

  // Process the user message (handles attachments automatically)
  await processUserMessage();
  const result = streamText({
    model: GetModel(model),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
    tools,
    onAbort: (error) => {
      console.error(error, 'error');
    },
    onError: (error) => {
      console.error(error, 'error');
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ responseMessage }) => {
      await processAIResponse(responseMessage);
    },
    onError: (error) => {
      console.error(error, 'error');
      return 'Error: ' + error;
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  if (!user_id) {
    return NextResponse.json(
      {
        error: 'User ID is required',
      },
      { status: 400 },
    );
  }
  const channels = await storage.streamStorage.getChannels(user_id);
  return NextResponse.json(channels?.map((channel) => channel.data) || []);
}
