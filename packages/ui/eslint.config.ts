import type { Config } from "typescript-eslint";
import baseConfig from "@simple-stream/eslint-config/base";
import reactConfig from "@simple-stream/eslint-config/react";

export default [
  ...baseConfig,
  ...reactConfig,
  {
    ignores: ["dist/**"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/prefer-includes": "off",
      "@typescript-eslint/prefer-string-starts-ends-with": "off",
      "@typescript-eslint/require-await": "off",
      "prefer-const": "off",
      "@typescript-eslint/no-empty-object-type": "off"
    }
  }
] satisfies Config;
