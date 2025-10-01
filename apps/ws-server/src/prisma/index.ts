import type {
  AIChatRequest,
  AIChatResponse,
  CTR,
  Providers,
  Rm
} from "@simple-stream/types";
import { DbService, PrismaClient } from "@simple-stream/db/node";
import { EncryptionService } from "@simple-stream/encryption";
import { Fs } from "@d0paminedriven/fs";
import type { UserData } from "@/types/index.ts";
import { ModelService } from "@/models/index.ts";

export class PrismaService extends ModelService {
  readonly prismaClient: PrismaClient;
  private encryption: EncryptionService;
  constructor(
    prisma: DbService,
    public fs: Fs
  ) {
    super();
    this.encryption = new EncryptionService(process.env.ENCRYPTION_KEY);
    this.prismaClient = prisma.prismaClient;
  }

  public async getAndValidateUserSessionByEmail(id: string) {
    const res = await this.prismaClient.user.findUniqueOrThrow({
      where: { id },
      include: { sessions: true }
      // cacheStrategy: { ttl: 60, swr: 3600 }
    });

    const sesh = res?.sessions.sort(
      (a, b) => b?.expiresAt?.getTime() - a.expiresAt.getTime()
    );
    let isValid = false;
    if (sesh?.[0]) {
      isValid = sesh?.[0].expiresAt.getTime() > new Date(Date.now()).getTime();
    }
    return {
      userId: id,
      email: res.email,
      isValid
    };
  }
  private handleLatLng(latlng?: string) {
    const [lat, lng] = latlng
      ? (latlng?.split(",")?.map(p => {
          return Number.parseFloat(p);
        }) as [number, number])
      : [47.7749, -122.4194];
    return [lat, lng] as const;
  }
  public async updateProfile({
    city,
    country,
    latlng,
    region,
    tz,
    postalCode,
    userId
  }: { [P in keyof UserData]-?: UserData[P] } & { userId: string }) {
    const [lat, lng] = this.handleLatLng(latlng); // formatted `${lat},${lng}` in the cookie value for the key latlng
    await this.prismaClient.profile.upsert({
      where: { userId },
      create: {
        city,
        country,
        userId: userId,
        timezone: tz,
        region,
        postalCode,
        lat,
        lng
      },
      update: {
        city,
        country,
        region,
        userId,
        postalCode,
        timezone: tz,
        lat,
        lng
      }
    });
  }

  /**
   * ```ts
   * (property) userProviderKeyMap: Map<`${string}_openai` | `${string}_grok` | `${string}_gemini` | `${string}_anthropic`, string | undefined>
   * ```
   */
  private userProviderKeyMap = new Map<Providers, string | undefined>();

  public async handleApiKeyLookup(provider: Providers, userId?: string) {
    if (!userId) {
      this.userProviderKeyMap.clear();
      throw new Error("unauthorized");
    }
    const rec = await this.prismaClient.userKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: this.providerToPrismaFormat(provider)
        }
      }
    });
    if (!rec) {
      console.error(`No API key configured for ${provider}!`);
      return { apiKey: null, keyId: null };
    }
    try {
      const hasKey = this.userProviderKeyMap.get(provider);
      if (typeof hasKey !== "undefined") {
        return { apiKey: hasKey, keyId: rec.id };
      }

      const decrypted = await this.encryption.decryptText({
        authTag: rec.authTag,
        data: rec.apiKey,
        iv: rec.iv
      });

      this.userProviderKeyMap.set(provider, decrypted);

      return { apiKey: decrypted, keyId: rec.id };
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Decryption failed for: ${provider}, ` + err.message);
        return { apiKey: null, keyId: null };
      } else return { apiKey: null, keyId: null };
    }
  }

  public parseDraftId(draftId: string) {
    if (/^(?:[A-Za-z0-9_-]+~){3}(?:0|[1-9][0-9]*)$/.test(draftId) === false) {
      throw new Error(`invalid draftId ${draftId}`);
    }
    const toArr = draftId.split("~");

    return toArr.map((v, o) =>
      o !== toArr.length - 1 ? v : Number.parseInt(v, 10)
    ) as [string, string, string, number];
  }

  public async handleAiChatRequest({
    userId,
    provider,
    conversationId,
    ...data
  }: Rm<AIChatRequest, "type"> & {
    userId: string;
  }) {
    const { keyId, apiKey } = await this.handleApiKeyLookup(provider, userId);
    if (conversationId === "new-chat") {
      const batchIt = await this.prismaClient.$transaction(async pr => {
        return await pr.conversation.create({
          include: {
            conversationSettings: true,
            messages: {
              orderBy: { createdAt: "asc" }
            }
          },
          data: {
            messages: {
              create: {
                content: data.prompt,
                provider: this.providerToPrismaFormat(provider),
                senderType: "USER",
                model: data.model ?? "gpt-5-nano",
                userId,
                userKeyId: keyId
              }
            },
            conversationSettings: {
              create: {
                maxTokens: data.maxTokens ?? null,
                topP: data.topP ?? null,
                systemPrompt: data.systemPrompt ?? null,
                temperature: data.temperature ?? null
              }
            },
            userKeyId: keyId,
            userId
          }
        });
      });
      return {
        apiKey,
        ...batchIt
      };
    } else {
      const batchIt = await this.prismaClient.$transaction(async pr => {
        return await pr.conversation.update({
          include: {
            conversationSettings: true,
            messages: {
              orderBy: { createdAt: "asc" }
            }
          },
          where: { id: conversationId },
          data: {
            messages: {
              create: {
                content: data.prompt,
                senderType: "USER",
                provider: this.providerToPrismaFormat(provider),
                model: data.model ?? "gpt-5-nano",
                userId,
                userKeyId: keyId
              }
            },
            conversationSettings: {
              update: {
                maxTokens: data.maxTokens ?? null,
                topP: data.topP ?? null,
                systemPrompt: data.systemPrompt ?? null,
                temperature: data.temperature ?? null
              }
            },
            userId,
            userKeyId: keyId
          }
        });
      });
      return {
        apiKey,
        ...batchIt
      };
    }
  }

  /**
   * Count user messages sent in the past window that used fallback (no user key).
   * Default window is last 24 hours and only counts USER-sent messages.
   */
  public async countFallbackUserMessages(
    userId: string,
    windowMs = 24 * 60 * 60 * 1000
  ): Promise<number> {
    const since = new Date(Date.now() - windowMs);
    return this.prismaClient.message.count({
      where: {
        userId,
        senderType: "USER",
        userKeyId: null,
        createdAt: { gte: since }
      }
    });
  }

  public async handleAiChatResponse({
    userId,
    provider,
    ...data
  }: Rm<CTR<AIChatResponse, "provider">, "type">) {
    const { keyId } = await this.handleApiKeyLookup(provider, userId);
    return this.prismaClient.conversation.update({
      include: { messages: true, conversationSettings: true },
      where: { id: data.conversationId },
      data: {
        messages: {
          create: {
            content: data.chunk,
            senderType: "AI",
            provider: this.providerToPrismaFormat(provider),
            model: data.model ?? "gpt-5-nano",
            thinkingDuration: data.thinkingDuration ?? null,
            thinkingText: data?.thinkingText ?? null,
            userId,
            userKeyId: keyId
          }
        },
        userId,
        title: data.title ?? null,
        userKeyId: keyId
      }
    });
  }

  public convoId(conversationId?: string | null) {
    return conversationId && conversationId !== "new-chat"
      ? conversationId
      : null;
  }
}
