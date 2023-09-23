/* eslint @typescript-eslint/ban-ts-comment: 0  -- for test */
import path from "path";
import type { UserConfig } from "vite";
// @ts-ignore
import eslint4b from "vite-plugin-eslint4b";

const config: UserConfig = {
  plugins: [
    eslint4b(), // <-
  ],
  resolve: {
    alias: {
      globby: path.join(__dirname, "./src/shim/empty.ts"),
      fs: path.join(__dirname, "./src/shim/empty.ts"),
      typescript: path.join(__dirname, "./src/shim/typescript"),
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
  },
};
export default config;
