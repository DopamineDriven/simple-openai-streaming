import type { Socket } from "net";
import type { RawData } from "ws";

export {};

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
