import type {
  FlexiProvider,
  OpenAiError,
  OpenAiResponse
} from "@simple-stream/types";

export class KeyValidator {
  private openai_url = "https://api.openai.com/v1/models";
  constructor(
    private apiKey: string,
    private provider: FlexiProvider
  ) {}

  private async callRest(apiKey: string, url: string) {
    switch (this.provider) {
      case "OPENAI":
      case "openai":
      default: {
        return (await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` }
        })) satisfies Response;
      }
    }
  }

  private async openai() {
    let status = 0;
    const res = await this.callRest(this.apiKey, this.openai_url);
    status = res.status;
    const parseIt = JSON.parse(await res.text()) as OpenAiResponse;
    if (res.ok) {
      return {
        isValid: true,
        message: `valid_api_key__openai__${status}`
      };
    } else if (status === 429) {
      return { isValid: true, message: `valid_api_key__openai__${status}` };
    } else {
      const { error } = parseIt as OpenAiError;
      return {
        isValid: false,
        message: `invalid_api_key__openai__${status}__${error.code}__${error.message}__${error.type}`
      };
    }
  }

  public async validateProvider() {
    switch (this.provider) {
      case "OPENAI":
      case "openai":
      default: {
        const validate = await this.openai();
        return validate;
      }
    }
  }
}
