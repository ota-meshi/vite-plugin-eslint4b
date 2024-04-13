import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  target: "node14",
  entryPoints: ["src/vite-plugin-eslint4b.ts"],
  format: ["cjs", "esm"],
  outDir: "lib",
  external: ["vite"],
});
