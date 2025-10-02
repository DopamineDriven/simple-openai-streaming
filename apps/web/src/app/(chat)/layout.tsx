import React from "react";
import { redirect } from "next/navigation";
import { AIChatProvider } from "@/context/ai-chat-context";
import { ApiKeysProvider } from "@/context/api-keys-context";
import { ChatWebSocketProvider } from "@/context/chat-ws-context";
import { ModelSelectionProvider } from "@/context/model-selection-context";
import { getSession } from "@/lib/auth";

export default async function AuthedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");
  return (
    <ChatWebSocketProvider user={session.user}>
      <ModelSelectionProvider>
        <ApiKeysProvider userId={session.user.id}>
          <AIChatProvider userId={session.user.id}>{children}</AIChatProvider>
        </ApiKeysProvider>
      </ModelSelectionProvider>
    </ChatWebSocketProvider>
  );
}
