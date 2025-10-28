import { NextResponse } from "next/server";
import { createStreamStorageClient } from "@stream-io/ai-sdk-storage";
import { createConfigFromEnv } from "@stream-io/ai-sdk-storage/dist/utils";

const storage = createStreamStorageClient(createConfigFromEnv());

export async function GET(req: Request, { params }: any) {
  const { id } = await params;
  try {
    return NextResponse.json(
      await storage.streamStorage.getChannelMessages(id)
    );
  } catch (error) {
    return NextResponse.json([], { status: 404 });
  }
}
