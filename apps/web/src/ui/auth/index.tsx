"use client";

import { Github } from "@simple-stream/ui";
import Image from "next/image";
import { signinGithub } from "@/lib/auth-login";
import { Logo } from "@/ui/logo";

export function AuthUI({
  target = "sign_in"
}: {
  target: "sign_in" | "sign_up";
}) {
  return (
    <div className="bg-background text-foreground grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-20">
        <div className="w-full max-w-sm">
          <div>
            <Logo className="text-foreground h-10 w-10" />
            <h1 className="mt-8 text-2xl font-bold tracking-tight">
              {target === "sign_in" ? "Sign In" : "Sign Up"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Choose a provider to continue
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={signinGithub}
              className="bg-muted text-foreground hover:bg-background border-border inline-flex w-full items-center justify-center gap-3 rounded-md border px-4 py-2 text-sm font-semibold transition-colors">
              <Github />
              <span className="sr-only">
                {target === "sign_in"
                  ? "Sign In with GitHub"
                  : "Continue with GitHub"}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <Image
          alt="humanity-x-ai"
          src="https://assets.aicoalesce.com/upload/nrr6h4r4480f6kviycyo1zhf/1759131668389-aicoalesce-og-final-1758955992844.png"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    </div>
  );
}
/**
 * TODO
 * CREATE app/(nextauth)/nextauth/signin/page.tsx and app/(nextauth)/nextauth/signout/page.tsx files

```tsx
import { SignInUI } from "@/ui/auth";

export default function SignInPage() {
  return <SignInUI />;
}
```


* TODO
* RE-ADD TO lib/auth.config.ts

```ts
  pages: { signIn: "/nextauth/signin" },
```
 */
