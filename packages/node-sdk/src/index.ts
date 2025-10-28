// Main exports
export { StreamStorage } from "./storage";
export { AISDKStreamStorage } from "./ai-sdk-helpers";

// Type exports
export type {
  StreamStorageConfig,
  CreateChannelOptions,
  SendMessageOptions,
  AISDKMessage,
  StreamStorageClient,
  ChannelData,
  MessageAttachment,
} from "./types";

// Utility functions
export { createStreamStorageClient } from "./utils";

// Re-export Stream Chat types that might be useful
export type { Channel, StreamChat } from "stream-chat";
