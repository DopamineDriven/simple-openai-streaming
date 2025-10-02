import {
  anonymousClient,
  customSessionClient
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site-url";

export const authClient = createAuthClient({
  baseURL: getSiteUrl(process.env.NODE_ENV),
  plugins: [anonymousClient(), customSessionClient<typeof auth>()],
  basePath: getSiteUrl(process.env.NODE_ENV)
});
export const { signIn, signOut, useSession } = authClient;
