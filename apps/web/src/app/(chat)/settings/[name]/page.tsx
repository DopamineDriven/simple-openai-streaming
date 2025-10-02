import type { Metadata } from "next";
import { InferGSPRT } from "@simple-stream/types";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prismaClient } from "@/lib/prisma";
import { ormHandler } from "@/orm";
import { default as SettingsPage } from "@/ui/settings";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

const { prismaApiKeyService } = ormHandler(prismaClient);
export async function generateStaticParams() {
  const sesh = await getSession();
  if (!sesh?.user) {
    return [{ name: "user-id" }];
  }
  return [{ name: sesh?.user.id }];
}

export async function generateMetadata({
  params
}: InferGSPRT<typeof generateStaticParams>): Promise<Metadata> {
  const { name } = await params;
  if (name !== "user-id") {
    const sesh = await getSession();
    const userName = sesh?.user.name ?? name;
    return {
      title: userName + " | Settings"
    };
  } else {
    return {
      title: "Settings"
    };
  }
}

export default async function Settings({
  params
}: InferGSPRT<typeof generateStaticParams>) {
  const { name } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");
  if (session.user.id !== name) redirect("/auth/login");
  const keyData = await prismaApiKeyService.getClientApiKeys(session.user.id);
  return (
    <Suspense fallback={"Loading..."}>
      <SettingsPage user={session?.user} initialData={keyData} />
    </Suspense>
  );
}
