import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  treeshake: true,
  sourcemap: true,
  minify: true,
  clean: true,
  dts: true,
  splitting: false,
  format: ["cjs", "esm"],
  injectStyle: false,
});
