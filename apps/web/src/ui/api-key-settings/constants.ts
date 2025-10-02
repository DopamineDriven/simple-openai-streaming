import {
  OpenAiIcon
} from "@simple-stream/ui";
import type { ApiKeyData } from "@/ui/api-key-settings/types";

export const providerObj = [
  {
    provider: "openai",
    text: "OpenAI",
    icon: OpenAiIcon,
    value: "sk-************************************************",
    isSet: true,
    isDefault: true
  }
] satisfies ApiKeyData[];

export const CARD_HEADER_TEXT =
  "Bring your own API keys for expanded model support. This allows for substantially higher usage limits and access to premium models.";
export const CARD_FOOTER_TEXT =
  "API keys are encrypted at rest and are only used to communicate with respective model providers in secure server contexts.";

export const API_KEY_SETTINGS_TEXT_CONSTS = {
  CARD_HEADER_TEXT,
  CARD_FOOTER_TEXT
} as const;
