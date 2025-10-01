import type { Options } from "tsup";
import { defineConfig } from "tsup";

export default defineConfig(
  (
    options: Omit<
      Options,
      | "clean"
      | "dts"
      | "entry"
      | "format"
      | "minify"
      | "target"
      | "outDir"
      | "treeshake"
    >
  ) =>
    ({
      clean: true,
      dts: true,
      entry: [
        "!src/test/**",
        // apps/web output -> not transpiled
        "!edge/**",
        // apps/ws-server output -> transpiled to dist
        "src/**/*.ts"
      ],
      format: ["esm"],
      minify: true,
      target: "esnext",
      outDir: "dist",
      treeshake: true,
      ...options
    }) satisfies Options
);
