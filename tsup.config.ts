import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entryPoints: ["src/vite-plugin-eslint4b.ts"],
  format: ["cjs", "esm"],
  outDir: "lib",
});
