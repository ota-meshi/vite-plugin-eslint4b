/* eslint @typescript-eslint/ban-ts-comment: 0  -- for test */
import type { UserConfig } from "vite";
// @ts-ignore
import buildVitePluginESLint4B from "vite-plugin-eslint4b";

const config: UserConfig = {
  plugins: [
    buildVitePluginESLint4B(), // <-
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
  },
};
export default config;
