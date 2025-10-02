import type { Metadata } from "next";
import type { InferGSPRT } from "@simple-stream/types";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { DynamicChatRouteProps } from "@/types/shared";
import { getSession as auth } from "@/lib/auth";
import { prismaClient } from "@/lib/prisma";
import { ormHandler } from "@/orm";
import { ChatAreaSkeleton } from "@/ui/chat/chat-area-skeleton";
import { ChatInterface } from "@/ui/chat/dynamic";

// Create once at module level
const { prismaConversationService } = ormHandler(prismaClient);

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [{ conversationId: "new-chat" }, { conversationId: "home" }];
}

export async function generateMetadata({
  params
}: InferGSPRT<typeof generateStaticParams>): Promise<Metadata> {
  const { conversationId } = await params;
  if (conversationId !== "new-chat" && conversationId !== "home") {
    const title =
      await prismaConversationService.getTitleByConversationId(conversationId);
    return {
      title
    };
  } else if (conversationId === "home") {
    return {
      title: "Home"
    };
  }
  return {
    title: "New Chat"
  };
}

export default async function ChatPage({
  params
}: InferGSPRT<typeof generateStaticParams>) {
  const { conversationId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Fetch data directly on the server
  let messages: DynamicChatRouteProps | null = null;
  let conversationTitle: string | null = null;
  if (conversationId !== "new-chat" && conversationId !== "home") {
    const data =
      await prismaConversationService.getMessagesByConversationId(
        conversationId
      );

    if (data) {
      messages = data.messages.map(t => {
        const { ...rest } = t;

        return { ...rest };
      });
      conversationTitle = data.title;
    }
  }

  return (
    <Suspense fallback={<ChatAreaSkeleton />}>
      <ChatInterface
        initialMessages={messages}
        conversationTitle={conversationTitle}
        conversationId={conversationId}
        user={session.user}
      />
    </Suspense>
  );
}
