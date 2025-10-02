import type { $Enums, Message as MessagePrisma } from "@simple-stream/db/edge-client";
import type { Providers, RTC } from "@simple-stream/types";

export type ClientWorkupProps = {
  isSet: Record<Providers, boolean>;
  isDefault: Record<Providers, boolean>;
};

export type UIMessage = RTC<MessagePrisma, "conversationId">;

export type RxnUnion =
  | "liked"
  | "disliked"
  | "unliked"
  | "undisliked"
  | "switch-to-liked"
  | "switch-to-disliked";

export type DynamicChatRouteProps =
  | {
      id: string;
      conversationId: string;
      userId: string | null;
      senderType: $Enums.SenderType;
      provider: $Enums.Provider;
      model: string | null;
      userKeyId: string | null;
      content: string;
      thinkingText: string | null;
      thinkingDuration: number | null;
      liked: boolean | null;
      disliked: boolean | null;
      tryAgain: boolean | null;
      createdAt: Date;
      updatedAt: Date;
    }[]
  | null;
