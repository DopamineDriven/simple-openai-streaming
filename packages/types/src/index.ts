/**
 * shared websocket (client-server) events
 */
export type {
  AIChatChunk,
  AIChatError,
  AIChatEventTypeUnion,
  AIChatInlineData,
  AIChatRequestUserMetadata,
  AIChatRequest,
  AIChatResEntity,
  AIChatResponse,
  AnyEvent,
  AnyEventTypeUnion,
  ChatWsEvent,
  ChatWsEventTypeUnion,
  ClientContextWorkupProps,
  EventMap,
  EventTypeMap,
  PingMessage,
  RecordCountsProps,
  TypingIndicator
} from "@/events.ts";

/**
 * model/provider types
 */
export type {
  AllDisplayNamesUnion,
  AllModelsUnion,
  DisplayNameModelMap,
  GetDisplayNamesForProviderRT,
  GetModelsForProviderRT,
  GetModelUtilRT,
  ModelDisplayNameToModelId,
  ModelIdToModelDisplayName,
  ModelMap,
  Models,
  OpenAIChatModels,
  OpenAiDisplayNameUnion,
  OpenAiModelIdUnion,
  Provider,
  Providers
} from "@/models.ts";

export {
  allProviders,
  defaultModelDisplayNameByProvider,
  defaultModelIdByProvider,
  displayNameModelsByProvider,
  displayNameToModelId,
  getAllProviders,
  getDisplayNameByModelId,
  getDisplayNamesForProvider,
  getModelIdByDisplayName,
  getModelsForProvider,
  modelIdsByProvider,
  modelIdToDisplayName,
  providerModelChatApi,
  toPrismaFormat
} from "@/models.ts";

/**
 * convenient utility types
 */
export type {
  ArrFieldReplacer,
  CTR,
  DX,
  Equal,
  Expect,
  Extends,
  InferGSPRT,
  InferGSPRTWorkup,
  IsExact,
  IsOptional,
  OnlyOptional,
  OnlyRequired,
  RTC,
  Rm,
  TCN,
  Unenumerate,
  Without,
  XOR
} from "@/utils.ts";

/**
 * api-handling types for codegen
 */

export type {
  FlexiProvider,
  ListModelsSingleton,
  OpenAiError,
  OpenAiResponse,
  SuccessResponse
} from "@/types.ts";

declare global {
  interface JSON {
    parse<T = unknown>(
      text: string,
      reviver?: (this: any, key: string, value: any) => any
    ): T;
  }
  interface Body {
    json<T = unknown>(): Promise<T>;
  }
}
