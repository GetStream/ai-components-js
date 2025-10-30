import { StreamStorage } from "./storage";
import { AISDKStreamStorage } from "./ai-sdk-helpers";
import type { StreamStorageConfig } from "./types";

/**
 * Creates a Stream Storage client with the provided configuration
 */
export function createStreamStorageClient(config: StreamStorageConfig) {
  const streamStorage = new StreamStorage(config);
  const aiSDKStreamStorage = new AISDKStreamStorage(streamStorage);

  return {
    streamStorage,
    aiSDKStreamStorage,
  };
}

/**
 * Validates Stream Storage configuration
 */
export function validateConfig(config: StreamStorageConfig): boolean {
  if (!config.apiKey) {
    throw new Error("Stream API key is required");
  }

  if (!config.apiSecret) {
    throw new Error("Stream API secret is required");
  }

  return true;
}

/**
 * Creates a default configuration with environment variables
 */
export function createConfigFromEnv(): StreamStorageConfig {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      "STREAM_API_KEY and STREAM_API_SECRET environment variables are required"
    );
  }

  return {
    apiKey,
    apiSecret,
    botUserId: process.env.STREAM_BOT_USER_ID || "ai-bot",
    adminUserId: process.env.STREAM_ADMIN_USER_ID || "admin",
  };
}

/**
 * Generates a random channel ID
 */
export const generateChannelId = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};
