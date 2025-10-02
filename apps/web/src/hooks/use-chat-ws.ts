"use client";

import type { ChatWsEvent, EventTypeMap } from "@simple-stream/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MessageHandler } from "@/types/chat-ws";
import { ChatWebSocketClient } from "@/utils/chat-ws-client";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4000";

export function useChatWebSocket(id?: string | null) {
  const [lastEvent, setLastEvent] = useState<ChatWsEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Build a stable URL and client instance per email
  const wsUrl = useMemo(
    () => (id ? `${WS_BASE}?id=${encodeURIComponent(id)}` : WS_BASE),
    [id]
  );

  const client = useMemo(() => new ChatWebSocketClient(wsUrl), [wsUrl]);

  // Track the most recent event without forcing re-renders on noisy events
  const lastEventRef = useRef<ChatWsEvent | null>(null);
  const updateScheduledRef = useRef(false);

  useEffect(() => {
    // Connect once per client instance
    client.connect();

    // Generic listener for all events (ignore noisy pings for lastEvent state)
    const handleEvent = (event: ChatWsEvent) => {
      lastEventRef.current = event;
      if (event.type !== "ping") {
        // Coalesce updates to once per frame to avoid update-depth loops
        if (!updateScheduledRef.current) {
          updateScheduledRef.current = true;
          requestAnimationFrame(() => {
            updateScheduledRef.current = false;
            setLastEvent(lastEventRef.current);
          });
        }
      } else {
        // ping also serves as a heartbeat to confirm connectivity
        setIsConnected(true);
      }
    };

    client.addListener(handleEvent);

    // Lightweight connectivity polling as a fallback to pings
    const intervalId = setInterval(() => {
      setIsConnected(prev =>
        prev !== client.isConnected ? client.isConnected : prev
      );
    }, 1000);

    // Initial connectivity snapshot
    setIsConnected(client.isConnected);

    return () => {
      clearInterval(intervalId);
      client.removeListener(handleEvent);
      client.close();
    };
  }, [client]);

  // Stable send function
  const sendEvent = useCallback(
    <T extends keyof EventTypeMap>(event: T, data: EventTypeMap[T]) => {
      client.send(event, data);
    },
    [client]
  );

  // Register handlers for specific typed events
  const on = useCallback(
    (event: keyof EventTypeMap, handler: MessageHandler<typeof event>) => {
      client.on(event, handler);
      return () => client.off(event);
    },
    [client]
  );

  // Manual cleanup helper (rarely needed since we clean up on client change/unmount)
  const disconnect = useCallback(() => {
    client.close();
  }, [client]);

  return { lastEvent, isConnected, sendEvent, client, on, disconnect };
}
