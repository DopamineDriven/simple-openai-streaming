import { Fs } from "@d0paminedriven/fs";
import * as dotenv from "dotenv";
import type { OpenAiResponse } from "@/types.ts";
import { Provider } from "@/models.ts";

dotenv.config({ quiet: true });

const providerModelChatApi = {
  openai: [
    "gpt-5",
    "gpt-5-codex",
    "gpt-5-mini",
    "gpt-5-nano",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "o4-mini",
    "o3",
    "o3-pro",
    "o3-mini",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4",
    "gpt-4-turbo",
    "gpt-3.5-turbo"
  ]
} as const;

async function openAiFetcher() {
  return await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ` + (process.env.OPENAI_API_KEY ?? "")
    }
  });
}

function normalizeSegments(segments: string[]): string[] {
  if (segments[0] === "grok") {
    const last = segments[segments.length - 1] ?? "";
    if (/^\d{4}$/.test(last)) {
      return segments.slice(0, -1);
    }
  }
  return segments;
}

function prettyModelName(id: string, provider: Provider = "openai") {
  let segments = id.split(/[-_]/);

  segments = normalizeSegments(segments);

  return segments
    .map(segment => {
      if (/\d/.test(segment)) {
        return segment;
      }
      if (
        (/^[a-zA-Z]+$/.test(segment) && segment.length <= 2) ||
        segment.startsWith("gpt")
      ) {
        return segment.toUpperCase();
      }
      return provider === "openai"
        ? !/(mini|nano|turbo|pro|codex)/.test(segment)
          ? segment.charAt(0).toUpperCase() + segment.slice(1)
          : segment
        : segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .map((s, i) =>
      provider === "openai"
        ? i === 0 && segments.length !== 1
          ? s.concat("-")
          : segments.length !== i + 1
            ? s.concat(" ")
            : s
        : s
    )
    .join(provider === "openai" ? "" : " ");
}

function formatOpenAI(props: OpenAiResponse) {
  if (!props.data) throw new Error(props.error.message);
  return props?.data?.map(t => {
    const { id, ...rest } = t;
    const displayName = prettyModelName(id);
    return { id, displayName, ...rest };
  });
}

const fs = new Fs(process.cwd());

const modelMapper = async (modelKeys = true) => {
  const openAiData = await openAiFetcher();

  const parseOpenAi = formatOpenAI(JSON.parse(await openAiData.text()));

  return Object.entries(providerModelChatApi).map(([provider, models]) => {
    const p = provider as keyof typeof providerModelChatApi;
    switch (p) {
      case "openai":
      default: {
        let helper = Array.of<[string, string]>();
        models.forEach(function (model) {
          modelKeys === true
            ? helper.push([
                model,
                parseOpenAi.find(t => t.id === `${model}`)?.displayName ?? model
              ])
            : helper.push([
                parseOpenAi.find(t => t.id === `${model}`)?.displayName ??
                  model,
                model
              ]);
        });
        return helper;
      }
    }
  });
};

async function displayNameModelIdGen<
  const T extends "keys=model-id" | "keys=display-name",
  const V extends "model-id-only" | "display-name-only"
>(target: T, arrayOnly?: V) {
  const mapper = await modelMapper(
    target === "keys=display-name" ? false : true
  );
  const openai = mapper[0];

  if (!openai) throw new Error("empty data in displayNameModelIdGen");

  if (typeof arrayOnly !== "undefined") {
    if (arrayOnly === "display-name-only") {
      if (target === "keys=display-name") {
        return {
          openai: openai.map(([keys, _v]) => keys)
        };
      } else {
        return {
          openai: openai.map(([_, vals]) => vals)
        };
      }
    } else {
      if (target === "keys=display-name") {
        return {
          openai: openai.map(([_, vals]) => vals)
        };
      } else {
        return {
          openai: openai.map(([keys, _v]) => keys)
        };
      }
    }
  }
  return {
    openai: Object.fromEntries(openai)
  };
}

(async () => {
  const displayNameToModelId = await displayNameModelIdGen("keys=display-name");

  const displayNameOnly = await displayNameModelIdGen(
    "keys=display-name",
    "display-name-only"
  );

  // prettier-ignore
  const displayNameToModelIdTemplate = `export const displayNameToModelId = ${JSON.stringify(displayNameToModelId, null, 2)} as const;`

  // prettier-ignore
  const displayNameOnlyTemplate = `export const displayNameModelsByProvider = ${JSON.stringify(displayNameOnly, null, 2)} as const;`

  const modelIdToDisplayName = await displayNameModelIdGen("keys=model-id");

  const modelIdsOnly = await displayNameModelIdGen(
    "keys=model-id",
    "model-id-only"
  );

  // prettier-ignore
  const modelIdsOnlyTemplate = `export const modelIdsByProvider = ${JSON.stringify(modelIdsOnly, null, 2)} as const;`

  // prettier-ignore
  const modelIdToDisplayNameTemplate = `export const modelIdToDisplayName = ${JSON.stringify(modelIdToDisplayName, null, 2)} as const;`

  fs.withWs(
    "src/codegen/__gen__/display-name-to-model-id.ts",
    displayNameToModelIdTemplate
  );
  fs.withWs(
    "src/codegen/__gen__/display-names-by-provider.ts",
    displayNameOnlyTemplate
  );
  fs.withWs(
    "src/codegen/__gen__/model-id-to-display-name.ts",
    modelIdToDisplayNameTemplate
  );
  fs.withWs(
    "src/codegen/__gen__/model-ids-by-provider.ts",
    modelIdsOnlyTemplate
  );
})();
