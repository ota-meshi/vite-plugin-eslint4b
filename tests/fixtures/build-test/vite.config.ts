/* eslint @typescript-eslint/ban-ts-comment: 0  -- for test */
import type { UserConfig } from "vite";
// @ts-ignore
import eslint4b from "vite-plugin-eslint4b";

const config: UserConfig = {
  plugins: [
    eslint4b(), // <-
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
