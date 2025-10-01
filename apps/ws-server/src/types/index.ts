import { WebSocket } from "ws";
import type { $Enums } from "@simple-stream/db/node/generated/client";
import type { EventTypeMap } from "@simple-stream/types";


export interface WSServerOptions {
  port: number;
  channel?: string;
}

export interface UserData {
      ip?: string;
    ua?: string;
  email?: string;
  city?: string;
  country?: string;
  region?: string;
  latlng?: string;
  postalCode?: string;
  tz?: string;
      locale?: string;
}

export type MessageHandler<T extends keyof EventTypeMap> = (
  event: EventTypeMap[T],
  ws: WebSocket,
  userId: string,
  userData?: UserData
) => Promise<void> | void;

export type HandlerMap = {
  [K in keyof EventTypeMap]?: MessageHandler<K>;
};

export type BufferLike =
  | string
  | Buffer
  | DataView
  | number
  | ArrayBufferView
  | Uint8Array
  | ArrayBuffer
  | SharedArrayBuffer
  | Blob
  | readonly any[]
  | readonly number[]
  | { valueOf(): ArrayBuffer }
  | { valueOf(): SharedArrayBuffer }
  | { valueOf(): Uint8Array }
  | { valueOf(): readonly number[] }
  | { valueOf(): string }
  | { [Symbol.toPrimitive](hint: string): string };

export interface ProviderChatRequestEntity {
  isNewChat: boolean;
  conversationId: string;
  title?: string;
  apiKey?: string;
  msgs: MessageSingleton[];
  systemPrompt?: string;
  userId: string;
  keyId: string | null;
  topP?: number;
  streamChannel: `stream:${string}`;
  temperature?: number;
  reasoningEffort?: string;
  outputVerbosity?: string;
  ws: WebSocket;
  max_tokens?: number;
  model?: string;
  chunks: string[];
  thinkingChunks: string[];
}

export type ConvoSettingsSingleton = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  conversationId: string;
  systemPrompt: string | null;
  temperature: number | null;
  topP: number | null;
  maxTokens: number | null;
  enableThinking: boolean | null;
  trackUsage: boolean | null;
  enableWebSearch: boolean | null;
  enableAssetGen: boolean | null;
  usageAlerts: boolean | null;
};

export type MessageSingleton = {
  id: string;
  userId: string | null;
  provider: $Enums.Provider;
  createdAt: Date;
  updatedAt: Date;
  userKeyId: string | null;
  conversationId: string;
  model: string | null;
  senderType: $Enums.SenderType;
  content: string;
  thinkingText: string | null;
  thinkingDuration: number | null;
  liked: boolean | null;
  disliked: boolean | null;
  tryAgain: boolean | null;
};

export type ConversationSingleton = {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  userKeyId: string | null;
  title: string | null;
  branchId: string | null;
  parentId: string | null;
  isShared: boolean;
  shareToken: string | null;
  apiKey: string | null;
  conversationSettings: ConvoSettingsSingleton | null;
  messages: MessageSingleton[];
};


export type Signals =
  | "SIGABRT"
  | "SIGALRM"
  | "SIGBREAK"
  | "SIGBUS"
  | "SIGCHLD"
  | "SIGCONT"
  | "SIGFPE"
  | "SIGHUP"
  | "SIGILL"
  | "SIGINFO"
  | "SIGINT"
  | "SIGIO"
  | "SIGIOT"
  | "SIGKILL"
  | "SIGLOST"
  | "SIGPIPE"
  | "SIGPOLL"
  | "SIGPROF"
  | "SIGPWR"
  | "SIGQUIT"
  | "SIGSEGV"
  | "SIGSTKFLT"
  | "SIGSTOP"
  | "SIGSYS"
  | "SIGTERM"
  | "SIGTRAP"
  | "SIGTSTP"
  | "SIGTTIN"
  | "SIGTTOU"
  | "SIGUNUSED"
  | "SIGURG"
  | "SIGUSR1"
  | "SIGUSR2"
  | "SIGVTALRM"
  | "SIGWINCH"
  | "SIGXCPU"
  | "SIGXFSZ";
