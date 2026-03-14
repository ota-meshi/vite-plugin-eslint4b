import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "vite-plugin-eslint4b": "src/vite-plugin-eslint4b.ts",
  },
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  outDir: "lib",
});
