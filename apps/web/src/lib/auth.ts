import { cache } from "react";
import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins/anonymous";
import { prismaClient } from "@/lib/prisma";
import { getSiteUrl } from "./site-url";

export const auth = betterAuth({
  database: prismaAdapter(prismaClient, {
    provider: "postgresql"
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? ""
    }
  },
  baseURL: getSiteUrl(process.env.NODE_ENV),
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 3600 // seconds
    }
  },
  user: {},
  plugins: [
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        const { ...userNew } = newUser.user;
        // const {expiresAt, ...sessionNew} = newUser.session;
        await prismaClient.$transaction(async t => {
          await t.user.update({
            where: { id: anonymousUser.user.id },
            data: {
              ...userNew
            }
          });
        });
      }
    }),
    nextCookies()
  ]
});

export const getSession = cache(async () => {
  return await auth.api.getSession({
    headers: await headers()
  });
});
