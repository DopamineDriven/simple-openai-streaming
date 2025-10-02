import { Fs } from "@d0paminedriven/fs";
import * as dotenv from "dotenv";
import { relative } from "path";
import { $Enums } from "@simple-stream/db/node/generated/client";

dotenv.config({ quiet: true, path: relative(process.cwd(), ".env") });
console.log(process.env.DATABASE_URL ??" ");
type MapItRT =
  | {
      thinking: string | null;
      msgNumber: number;
      content: string;
      timestamp: Date;
      id: string;
      provider: "OPENAI";
      model: string;
      sender: "USER" | "AI" | "SYSTEM";
    }[]
  | undefined;

class ScriptGen extends Fs {
  constructor(public override cwd: string) {
    super(process.cwd() ?? cwd);
  }

  private data = async (env: string, id= "our9v29ukp0c4gxp5sl4disf") => {
    const arr = Array.of<({
    messages: {
        id: string;
        userId: string | null;
        userKeyId: string | null;
        createdAt: Date;
        updatedAt: Date;
        conversationId: string;
        senderType: $Enums.SenderType;
        provider: $Enums.Provider;
        model: string | null;
        content: string;
        thinkingText: string | null;
        thinkingDuration: number | null;
        liked: boolean | null;
        disliked: boolean | null;
        tryAgain: boolean | null;
    }[];
} & {
    id: string;
    shareToken: string | null;
    userId: string;
    userKeyId: string | null;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
    branchId: string | null;
    parentId: string | null;
    isShared: boolean;
}) | null>();
    const { PrismaClient } = await import("@simple-stream/db/node/generated/client");
    const db = new PrismaClient({datasourceUrl: env});
    const prismaClient = db;
prismaClient.$connect();
    try {
      const data = await prismaClient.conversation.findUnique({
        where: { id: id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" }
          }
        }
      });
     arr.push(data)
      return data;
    } catch (err) {
      console.error(err);
    } finally {
      prismaClient.$disconnect();
      console.log(arr);
      return arr[0];
    }
  };

  public async Call(id = "our9v29ukp0c4gxp5sl4disf") {
    return await this.data(process.env.DATABASE_URL ?? "", id).then(s => {
      if (!s) return;
      console.log(s);
      this.withWs(
        `src/test/__out__/json/${s.title}/${s.id}.json`,
        JSON.stringify(s, null, 2)
      );
      return s;
    });
  }

  public async targeted(id?: string) {
    return await this.Call(id);
  }

  private async mapIt(id?: string) {
    return (await this.targeted(id))?.messages.map((msg, i) => {
      ++i;
      const content = msg.content,
        timestamp = new Date(msg.createdAt),
        id = msg.id,
        provider = msg.provider,
        model = msg.model ?? "",
        sender = msg.senderType as "USER" | "AI" | "SYSTEM",
        thinking = msg.thinkingText ?? null;

      return {
        thinking,
        msgNumber: i,
        content,
        timestamp,
        id,
        provider,
        model,
        sender
      };
    }) satisfies MapItRT;
  }

  private async out(id?: string, withThinking = "false") {
    const arr = Array.of<string>();
    const data = await this.mapIt(id);
    if (!data) return;
    for (const p of data) {
      const d = p.timestamp.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour12: false,
        timeZone: decodeURIComponent("america/chicago")
      });
      const handleProvider = p.provider;
      const agg =
        p.sender === "AI"

            ? p.thinking
              ? `${p.msgNumber}. ${p.model} (${handleProvider}) \n\n${p.thinking}\n\n${p.content}\n\n${d}\n`
              : `${p.msgNumber}. ${p.model} (${handleProvider})\n\n${p.content}\n\n${d}\n`
                    : `${p.msgNumber}. user \n\n${p.content}\n\n${d}\n`;
      arr.push(agg);
    }

    return arr;
  }

  public async gen(id?: string, withThinking = "false") {
    const [data, raw] = await Promise.all([
      this.out(id, withThinking),
      this.targeted(id)
    ]);
    if (!data) return;
    if (!raw) return;
    this.withWs(`src/test/__out__/md/${raw.title}.md`, data.join(`\n`));
  }
}

new ScriptGen(process.cwd()).gen("our9v29ukp0c4gxp5sl4disf", "true").then((d) =>{
  console.log(d);
});
