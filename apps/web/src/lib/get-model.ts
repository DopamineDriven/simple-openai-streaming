import type { GetModelUtilRT, Provider, Providers } from "@simple-stream/types";
import { providerModelChatApi } from "@simple-stream/types";

export const getModel = <
  const V extends Providers,
  const K extends GetModelUtilRT<V>
>(
  target: V,
  model?: K
): NonNullable<K> => {
  const xTarget = target as Provider;
  switch (xTarget) {
    case "openai":
    default: {
      if (
        model &&
        providerModelChatApi[xTarget].includes(
          model as GetModelUtilRT<"openai">
        )
      ) {
        return model;
      } else return "gpt-5-nano" as const as NonNullable<K>;
    }
  }
};
