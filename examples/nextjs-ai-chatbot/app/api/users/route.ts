import {
  createConfigFromEnv,
  createStreamStorageClient,
} from "@stream-io/ai-sdk-storage/dist/utils";
import { NextResponse } from "next/server";

const storage = createStreamStorageClient(createConfigFromEnv());

export async function POST() {
  const id = await storage.streamStorage.upsertUsers();

  return NextResponse.json({ id });
}
