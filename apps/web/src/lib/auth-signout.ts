import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export const signOutHelper = async () => {
   await authClient.signOut({
    fetchOptions: { onSuccess: redirect("/auth/login") }
  });

};
