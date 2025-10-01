import type { ResponseInput } from "openai/resources/responses/responses.mjs";
import type { Logger as PinoLogger } from "pino";
import type {
  Message,
  OutputVerbosity
} from "@simple-stream/db/node/generated/client";
import type { EventTypeMap, OpenAiModelIdUnion } from "@simple-stream/types";
import { EnhancedRedisPubSub } from "@simple-stream/redis";
import { OpenAI } from "openai";
import { Reasoning } from "openai/resources.js";
import { ResponseTextConfig } from "openai/resources/responses/responses.js";
import type { ProviderChatRequestEntity } from "@/types/index.ts";
import { LoggerService } from "@/logger/index.ts";
import { PrismaService } from "@/prisma/index.ts";

export interface ProviderOpenaiRequestEntity extends ProviderChatRequestEntity {
  user_location?: {
    type: "approximate";
    city?: string;
    region?: string;
    country?: string;
    tz?: string;
  };
}

export class OpenAIService {
  private defaultClient: OpenAI;
  private logger: PinoLogger;
  constructor(
    logger: LoggerService,
    private prisma: PrismaService,
    private redis: EnhancedRedisPubSub,
    private apiKey: string
  ) {
    this.logger = logger
      .getPinoInstance()
      .child(
        { pid: process.pid, node_version: process.version },
        { msgPrefix: "[openai] " }
      );
    this.defaultClient = new OpenAI({
      logLevel: "info",
      apiKey: this.apiKey,
      logger: this.logger
    });
  }

  public getClient(overrideKey?: string) {
    const client = this.defaultClient;
    if (overrideKey) {
      return client.withOptions({ apiKey: overrideKey });
    }

    return client;
  }

  private prependProviderModelTag(msgs: Message[]) {
    return msgs.map(msg => {
      if (msg.senderType === "USER") {
        return { role: "user", content: msg.content } as const;
      } else {
        const provider = msg.provider.toLowerCase();
        const model = msg.model ?? "";
        const modelIdentifier = `[${provider}/${model}]`;
        return {
          role: "assistant",
          content: `${modelIdentifier} \n` + msg.content
        } as const;
      }
    }) satisfies ResponseInput;
  }

  public buildInstructions(systemPrompt?: string) {
    return systemPrompt
      ? `${systemPrompt}\n\nNote: Previous responses may be tagged with their source model for context in the form of [PROVIDER/MODEL] notation.`
      : "Previous responses in this conversation may be tagged with their source model for context in the form of [PROVIDER/MODEL] notation.";
  }

  private formatMsgs(
    msgs: (
      | {
          readonly role: "user";
          readonly content: string;
        }
      | {
          readonly role: "assistant";
          readonly content: string;
        }
    )[]
  ) {
    return [...msgs] as const satisfies ResponseInput;
  }

  public formatOpenAi(isNewChat: boolean, msgs: Message[]) {
    if (isNewChat) {
      const first = msgs[0];
      if (!first) {
        return [{ role: "user", content: "" }] as const satisfies ResponseInput;
      }
      return [
        { role: "user", content: first.content }
      ] as const satisfies ResponseInput;
    } else {
      const history = this.prependProviderModelTag(msgs.slice(0, -1));
      const last = msgs.at(-1);
      if (last && last.senderType === "USER") {
        return [
          ...history,
          { role: "user", content: last.content }
        ] as const satisfies ResponseInput;
      }

      return this.formatMsgs(
        this.prependProviderModelTag(msgs)
      ) satisfies ResponseInput;
    }
  }

  private handleTooling(
    hasFiles = false,
    user_location?: {
      type: "approximate";
      city?: string | null;
      country?: string | null;
      region?: string | null;
      timezone?: string | null;
    },
    vector_store_ids?: string[]
  ) {
    if (hasFiles && vector_store_ids && vector_store_ids.length >= 1) {
      return [
        { type: "file_search", vector_store_ids },
        {
          type: "web_search_preview",
          user_location
        }
      ] satisfies OpenAI.Responses.Tool[];
    } else {
      return [
        {
          type: "web_search_preview",
          user_location
        }
      ] satisfies OpenAI.Responses.Tool[];
    }
  }
  private openaiReasoning(
    model: OpenAiModelIdUnion,
    effort?: string,
    summary: Reasoning["summary"] = "auto"
  ) {
    const eff = effort ? (effort as Reasoning["effort"]) : undefined;
    switch (model) {
      case "gpt-5":
      case "gpt-5-mini":
      case "gpt-5-nano":
      case "gpt-5-codex":
      case "o3":
      case "o3-mini":
      case "o3-pro":
      case "o4-mini": {
        return { effort: eff, summary } satisfies Reasoning;
      }
      case "gpt-3.5-turbo":
      case "gpt-4":
      case "gpt-4-turbo":
      case "gpt-4.1":
      case "gpt-4.1-mini":
      case "gpt-4.1-nano":
      case "gpt-4o":
      case "gpt-4o-mini":
      default: {
        return undefined;
      }
    }
  }

  private openAiVerbosity(model: OpenAiModelIdUnion, verbosity?: string) {
    const v = verbosity ? (verbosity as OutputVerbosity) : undefined;
    switch (model) {
      case "gpt-5":
      case "gpt-5-mini":
      case "gpt-5-nano":
      case "gpt-5-codex": {
        return { verbosity: v } satisfies ResponseTextConfig;
      }
      case "o3":
      case "o3-mini":
      case "o3-pro":
      case "o4-mini":
      case "gpt-3.5-turbo":
      case "gpt-4":
      case "gpt-4-turbo":
      case "gpt-4.1":
      case "gpt-4.1-mini":
      case "gpt-4.1-nano":
      case "gpt-4o":
      case "gpt-4o-mini":
      default: {
        return undefined;
      }
    }
  }

  public async handleOpenaiAiChatRequest({
    chunks,
    conversationId,
    isNewChat,
    msgs,
    keyId: _keyId,
    outputVerbosity,
    reasoningEffort,
    streamChannel,
    thinkingChunks,
    userId,
    ws,
    apiKey,
    max_tokens,
    model = "gpt-5-mini",
    systemPrompt,
    temperature,
    title,
    topP,
    user_location
  }: ProviderOpenaiRequestEntity) {
    const provider = "openai" as const;
    let openaiThinkingStartTime: number | null = null,
      openaiThinkingDuration = 0,
      openaiIsCurrentlyThinking = false,
      openaiThinkingAgg = "",
      openaiAgg = "";

    const client = this.getClient(apiKey ?? undefined);

    const responsesStream = await client.responses.create({
      stream: true,
      input: this.formatOpenAi(isNewChat, msgs),
      instructions: this.buildInstructions(systemPrompt),
      store: false,
      model,
      temperature,
      text: this.openAiVerbosity(model as OpenAiModelIdUnion, outputVerbosity),
      max_output_tokens: max_tokens,
      top_p: topP,
      reasoning: this.openaiReasoning(
        model as OpenAiModelIdUnion,
        reasoningEffort
      ),
      truncation: "auto",
      parallel_tool_calls: true,
      tools: this.handleTooling(false, user_location)
    });

    for await (const s of responsesStream) {
      let text: string | undefined = undefined,
        thinkingText: string | undefined = undefined,
        done = false;
      if (
        s.type === "response.reasoning_text.delta" ||
        s.type === "response.reasoning_summary_text.delta"
      ) {
        if (!openaiIsCurrentlyThinking && openaiThinkingStartTime === null) {
          openaiIsCurrentlyThinking = true;
          openaiThinkingStartTime = performance.now();
        }

        thinkingText = s.delta;
      }
      if (
        (s.type === "response.reasoning_summary_text.done" ||
          s.type === "response.reasoning_text.done") &&
        openaiIsCurrentlyThinking &&
        openaiThinkingStartTime !== null
      ) {
        openaiIsCurrentlyThinking = false;
        openaiThinkingDuration = Math.round(
          performance.now() - openaiThinkingStartTime
        );
      }
      if (s.type === "response.output_text.delta") {
        text = s.delta;
      }
      if (s.type === "response.output_text.done") {
        done = true;
      }

      if (thinkingText) {
        openaiThinkingAgg += thinkingText;
        thinkingChunks.push(thinkingText);

        ws.send(
          JSON.stringify({
            type: "ai_chat_chunk",
            conversationId,
            done: false,
            userId,
            model,
            provider,
            systemPrompt,
            temperature,
            title,
            topP,
            thinkingText: thinkingText,
            thinkingDuration: openaiThinkingStartTime
              ? performance.now() - openaiThinkingStartTime
              : undefined,
            isThinking: true
          } satisfies EventTypeMap["ai_chat_chunk"])
        );
        void this.redis.publishTypedEvent(streamChannel, "ai_chat_chunk", {
          type: "ai_chat_chunk",
          conversationId,
          userId,
          model,
          thinkingDuration: openaiThinkingStartTime
            ? performance.now() - openaiThinkingStartTime
            : undefined,
          title,
          systemPrompt,
          temperature,
          topP,
          provider,
          thinkingText: thinkingText,
          isThinking: true,
          done: false
        });
      } // Handle regular text chunks
      if (text) {
        openaiAgg += text;
        chunks.push(text);
        ws.send(
          JSON.stringify({
            type: "ai_chat_chunk",
            conversationId,
            userId,
            provider,
            title,
            model,
            systemPrompt,
            temperature,
            topP,
            chunk: text,
            isThinking: openaiIsCurrentlyThinking,
            thinkingText:
              openaiThinkingAgg.length > 0 ? openaiThinkingAgg : undefined,
            thinkingDuration:
              openaiThinkingDuration > 0 ? openaiThinkingDuration : undefined,
            done: false
          } satisfies EventTypeMap["ai_chat_chunk"])
        );
        void this.redis.publishTypedEvent(streamChannel, "ai_chat_chunk", {
          type: "ai_chat_chunk",
          conversationId,
          userId,
          model,
          title,
          systemPrompt,
          temperature,
          topP,
          isThinking: openaiIsCurrentlyThinking,
          provider,
          thinkingText:
            openaiThinkingAgg.length > 0 ? openaiThinkingAgg : undefined,
          thinkingDuration:
            openaiThinkingDuration > 0 ? openaiThinkingDuration : undefined,

          chunk: text,
          done: false
        });
        if (chunks.length % 10 === 0) {
          void this.redis.saveStreamState(
            conversationId,
            chunks,
            {
              model,
              provider,
              title,
              totalChunks: chunks.length,
              completed: false,
              systemPrompt,
              temperature,
              topP
            },
            thinkingChunks
          );
        }
      }
      if (done) {
        await this.prisma.handleAiChatResponse({
          chunk: openaiAgg,
          conversationId,
          done: true,
          title,
          temperature,
          topP,
          provider,
          userId,
          systemPrompt,
          model,
          thinkingText:
            openaiThinkingAgg.length > 0 ? openaiThinkingAgg : undefined,
          thinkingDuration:
            openaiThinkingDuration > 0 ? openaiThinkingDuration : undefined
        });
        ws.send(
          JSON.stringify({
            type: "ai_chat_response",
            conversationId,
            userId,
            provider,
            model,
            title,
            systemPrompt,
            temperature,
            topP,
            chunk: openaiAgg,
            thinkingText:
              openaiThinkingAgg.length > 0 ? openaiThinkingAgg : undefined,
            thinkingDuration:
              openaiThinkingDuration > 0 ? openaiThinkingDuration : undefined,
            done: true
          } satisfies EventTypeMap["ai_chat_response"])
        );
        void this.redis.publishTypedEvent(streamChannel, "ai_chat_response", {
          type: "ai_chat_response",
          conversationId,
          userId,
          systemPrompt,
          temperature,
          title,
          thinkingText:
            openaiThinkingAgg.length > 0 ? openaiThinkingAgg : undefined,
          thinkingDuration:
            openaiThinkingDuration > 0 ? openaiThinkingDuration : undefined,
          topP,
          provider,
          model,
          chunk: openaiAgg,
          done: true
        });
        // Clear saved state on successful completion
        void this.redis.del(`stream:state:${conversationId}`);
        break;
      }
    }
  }
}
