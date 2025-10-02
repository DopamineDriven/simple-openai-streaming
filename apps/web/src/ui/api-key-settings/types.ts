import type { ComponentPropsWithRef, JSX } from "react";
import type { Providers } from "@simple-stream/types";

export interface ApiKeyData {
  provider: Providers;
  text: string;
  icon: ({
    ...svg
  }: Omit<
    ComponentPropsWithRef<"svg">,
    "viewBox" | "fill" | "xmlns" | "role"
  >) => JSX.Element;
  value?: string;
  isSet?: boolean;
  isDefault?: boolean;
}
