import type { GetModelUtilRT, Provider } from "@simple-stream/types";
import { providerModelChatApi } from "@simple-stream/types";

export class ModelService {
  constructor() {}

  public getModel = <
    const V extends Provider,
    const K extends GetModelUtilRT<V>
  >(
    target: V,
    model?: K
  ): NonNullable<K> => {
    let xTarget = target as Provider;
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
  public providerToPrismaFormat<const T extends Provider>(provider: T) {
    return provider.toUpperCase() as Uppercase<T>;
  }
}
