import type { OpenAiResponse } from "@simple-stream/types";
import * as dotenv from "dotenv";

dotenv.config({ quiet: true });
async function openAiFetcher() {
  return await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ` + (process.env.OPENAI_API_KEY ?? "")
    }
  });
}

const outputModels = async () => {
  const { Fs } = await import("@d0paminedriven/fs");
  const fs = new Fs(process.cwd());
  const openAiData = await openAiFetcher();
  const parseOpenAi = JSON.parse<OpenAiResponse>(await openAiData.text());
  fs.withWs(
    "src/test/__out__/openai-results.json",
    JSON.stringify(parseOpenAi, null, 2)
  );
};

async function validator() {
  const { KeyValidator } = await import("@/http/index.ts");
  if (!process.env.OPENAI_API_KEY) return;
  const kv = new KeyValidator(process.env.OPENAI_API_KEY, "openai");
  const { Fs } = await import("@d0paminedriven/fs");
  const fs = new Fs(process.cwd());
  const data = await kv.validateProvider();
  fs.withWs("src/test/__out__/init.json", JSON.stringify(data, null, 2));
}

if (process.argv[3] === "validate") {
  validator();
}

if (process.argv[3] === "generate-models") {
  outputModels();
}
