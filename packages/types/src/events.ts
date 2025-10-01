import type { GetModelUtilRT, Provider } from "@/models.ts";
import type { CTR, DX, Rm } from "@/utils.ts";

export type AIChatRequestUserMetadata = {
  ip?: string;
  ua?: string;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  tz?: string;
  postalCode?: string;
  locale?: string;
};

export type AIChatEventTypeUnion =
  | "chunk"
  | "error"
  | "inline_data"
  | "response";

export interface AIChatResEntity<T extends `ai_chat_${AIChatEventTypeUnion}`> {
  type: T;
  conversationId: string;
  userId: string;
  chunk?: string;
  done: T extends "ai_chat_error" ? true : boolean;
  data?: string;
  provider?: Provider;
  title?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
}

export type AIChatRequest = {
  type: "ai_chat_request";
  conversationId: string;
  prompt: string;
  provider: Provider;
  model?: GetModelUtilRT<Provider>;
  systemPrompt?: string;
  reasoningEffort?: string;
  outputVerbosity?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  hasProviderConfigured?: boolean;
  isDefaultProvider?: boolean;
  metadata?: AIChatRequestUserMetadata;
  batchId?: string;
};

export type AIChatInlineData = DX<
  CTR<AIChatResEntity<"ai_chat_inline_data">, "data">
>;

export type AIChatChunk = DX<
  AIChatResEntity<"ai_chat_chunk"> & {
    isThinking?: boolean;
    thinkingDuration?: number;
    thinkingText?: string;
  }
>;

export type AIChatResponse = DX<
  CTR<AIChatResEntity<"ai_chat_response">, "chunk"> & {
    usage?: number;
    thinkingDuration?: number;
    thinkingText?: string;
  }
>;

export type AIChatError = DX<
  Rm<AIChatResEntity<"ai_chat_error">, "chunk" | "data"> & {
    usage?: number;
    stopReason?: unknown;
    message: string;
  }
>;

export type TypingIndicator = {
  type: "typing";
  userId: string;
  conversationId: string;
};

export type PingMessage = {
  type: "ping";
};

export type AnyEvent =
  | AIChatChunk
  | AIChatError
  | AIChatInlineData
  | AIChatRequest
  | AIChatResponse
  | PingMessage
  | TypingIndicator;

export type AnyEventTypeUnion = AnyEvent["type"];

/**
 * type alias used in apps/web repo
 */
export type ChatWsEvent = AnyEvent;

/**
 * type alias used in apps/web repo
 */
export type ChatWsEventTypeUnion = ChatWsEvent["type"];

export type EventTypeMap = {
  ai_chat_chunk: AIChatChunk;
  ai_chat_error: AIChatError;
  ai_chat_inline_data: AIChatInlineData;
  ai_chat_request: AIChatRequest;
  ai_chat_response: AIChatResponse;
  ping: PingMessage;
  typing: TypingIndicator;
};

export type EventMap<T extends keyof EventTypeMap> = {
  [P in T]: EventTypeMap[P];
}[T];

export type RecordCountsProps = {
  isSet: Record<Provider, number>;
  isDefault: Record<Provider, number>;
};

export type ClientContextWorkupProps = {
  isSet: Record<Provider, boolean>;
  isDefault: Record<Provider, boolean>;
};
