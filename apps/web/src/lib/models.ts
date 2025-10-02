import type {
  AllModelsUnion,
  OpenAiDisplayNameUnion,
  OpenAiModelIdUnion
} from "@simple-stream/types";
import {
  defaultModelDisplayNameByProvider,
  defaultModelIdByProvider,
  displayNameToModelId,
  getDisplayNameByModelId,
  getModelIdByDisplayName
} from "@simple-stream/types";
import { OpenAiIcon } from "@simple-stream/ui";

export type Provider = keyof typeof displayNameToModelId;

export const providerMetadata = {
  openai: {
    name: "OpenAI",
    icon: OpenAiIcon,
    color: "#10a37f",
    description: "Advanced language models from OpenAI"
  }
} as const;

export type DisplayNameWorkup<T extends Provider> = T extends "openai"
  ? ReturnType<typeof getDisplayNameByModelId<T, OpenAiModelIdUnion>>
  : never;

export type ModelIdWorkup<T extends Provider> = T extends "openai"
  ? ReturnType<typeof getModelIdByDisplayName<T, OpenAiDisplayNameUnion>>
  : never;
/**
 * use this in client components where the select options are
 * the display names (the keys of the object) which, on select, outputs the
 * respective model id (the value for the model expected by the ws-server for ai_chat_request arguments)
 */
export type ModelSelection = {
  provider: Provider;
  displayName: string;
  modelId: string;
};

export type ModelSelectionAlt<T extends Provider> = {
  provider: T;
  displayName: DisplayNameWorkup<T>;
  modelId: ModelIdWorkup<T>;
};

export const defaultModelByProvider = defaultModelDisplayNameByProvider;

export { defaultModelIdByProvider };

export let defaultProvider: "openai";
export const defaultModelSelection: ModelSelection = {
  provider: (defaultProvider = "openai"),
  displayName: defaultModelByProvider[defaultProvider],
  modelId: getModelIdByDisplayName(
    (defaultProvider = "openai"),
    defaultModelByProvider[defaultProvider]
  )
};
export function getModelDisplayName(
  toProvider: Provider,
  modelId: string | null
) {
  const model = (modelId ??
    defaultModelIdByProvider[toProvider]) as AllModelsUnion;

  return getDisplayNameByModelId(toProvider, model as OpenAiModelIdUnion);
}
