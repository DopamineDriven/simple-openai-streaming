import process from "node:process";
import type { Socket } from "net";
import * as dotenv from "dotenv";
import type { Signals } from "@/types/index.ts";

export {};

dotenv.config({ quiet: true });

async function exe() {
  try {
    const isProd = typeof process.env.IS_PROD === "undefined";
    const { LoggerService } = await import("@/logger/index.ts");

    const { Fs } = await import("@d0paminedriven/fs");

    const fs = new Fs(process.cwd());

    const loggerConfig = {
      serviceName: "ws-server",
      environment:
        typeof process.env.IS_PROD === "undefined"
          ? "production"
          : "development",
      region: "us-east-1",
      taskArn: undefined,
      taskDefinition: undefined,
      logLevel: typeof process.env.IS_PROD === "undefined" ? "info" : "debug",
      isProd
    };

    const logger = LoggerService.getLoggerInstance(loggerConfig),
      log = logger.getPinoInstance();

    const redisUrl = "redis://localhost:6379",
      host = "localhost";
    const { EnhancedRedisPubSub } = await import("@simple-stream/redis");

    const redisInstance = new EnhancedRedisPubSub(redisUrl, host);

    const connectionString = process.env.DATABASE_URL ?? "";

    const { DbService } = await import("@simple-stream/db/node");

    const db = new DbService(connectionString);
    const { PrismaService } = await import("@/prisma/index.ts");

    const prisma = new PrismaService(db, fs);
    const port = 4000;

    const { WSServer } = await import("@/ws-server/index.ts");

    const wsServer = new WSServer({ port }, redisInstance, prisma);

    const { Resolver } = await import("@/resolver/index.ts");

    const { OpenAIService } = await import("@/openai/index.ts");

    const openai = new OpenAIService(
      logger,
      prisma,
      redisInstance,
      process.env.OPENAI_API_KEY ?? ""
    );

    const resolver = new Resolver(wsServer, openai);

    resolver.registerAll();
    wsServer.setResolver(resolver);
    setInterval(async () => {
      try {
        await redisInstance.ping();
      } catch (err) {
        log.error(
          "Redis health check failed: ".concat(
            err instanceof Error ? err.message : ""
          )
        );
      }
    }, 30000);
    await wsServer.start();

    let isShuttingDown = false;

    const gracefulShutdown = async <const T extends Signals>(signal: T) => {
      if (isShuttingDown) {
        log.info(`Already shutting down, ignoring ${signal}`);
        return;
      }

      isShuttingDown = true;
      log.warn(`${signal} received, shutting down gracefully...`);

      try {
        await wsServer.stop();
        log.info("Cleanup complete, exiting gracefully");
        process.exitCode = 0;
      } catch (error) {
        log.error(
          `Error during shutdown: ` +
            (typeof error === "string" ? error : JSON.stringify(error))
        );
        if (error instanceof Error) {
          log.error("Stacktrace: " + (error.stack ?? ""));
        }
        process.exitCode = 1;
      }
    };
    process.on("SIGTERM", async () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", async () => gracefulShutdown("SIGINT"));
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    else throw new Error(`something went wrong...`);
  }
}

exe();

declare module "ws" {
  interface WebSocket {
    _socket: Socket;
  }
}

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
