"use client";

import { Button, Github } from "@simple-stream/ui";
import Image from "next/image";
import { signinGithub } from "@/lib/auth-login";
import { Logo } from "@/ui/logo";

export function AuthUI({
  target = "sign_in"
}: {
  target: "sign_in" | "sign_up";
}) {
  return (
    <div className="bg-transparent text-foreground grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-20 bg-gradient-to-b from-gray-900 via-background/95 to-gray-900">
        <div className="w-full max-w-md">
          <div className="select-none">
            <Logo className="text-foreground stroke-foreground size-12" />
            <h1 className="mt-8 text-2xl font-bold tracking-tight">
              {target === "sign_in" ? "Sign In" : "Sign Up"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Choose a provider to continue
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3">
            <Button
              variant="ghost"
              type="button"
              size="lg"
              onClick={signinGithub}
              className="bg-background/50 text-foreground cursor-pointer hover:bg-transparent transition-color duration-150 border-foreground/50 inline-flex w-full items-center justify-center gap-3 rounded-md border px-4 py-2 text-sm font-semibold transition-colors">
              <Github className="size-12" />
              <span className="text-pretty">Continue with GitHub</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="relative z-10 inset-shadow-gray-100 flex-1 lg:block bg-gradient-to-b from-gray-900 via-background/95 to-gray-900">
        <Image
          width={2160}
          height={1260}
          alt="humanity-x-ai"
          src="https://assets.aicoalesce.com/upload/nrr6h4r4480f6kviycyo1zhf/1759131668389-aicoalesce-og-final-1758955992844.png"
          className="absolute inset-0 w-full my-auto object-cover rounded-sm"
        />
      </div>
    </div>
  );
}
