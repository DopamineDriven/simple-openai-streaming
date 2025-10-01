import type { XOR } from "@/utils.ts";

export type FlexiProvider = "openai" | "OPENAI";

export interface ListModelsSingleton {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export type SuccessResponse = {
  object: "list";
  data: ListModelsSingleton[];
};

export type OpenAiError = {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
};

export type OpenAiResponse = XOR<OpenAiError, SuccessResponse>;
