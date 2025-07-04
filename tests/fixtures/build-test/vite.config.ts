/* eslint @typescript-eslint/ban-ts-comment: 0  -- for test */
import path from "path";
import type { UserConfig } from "vite";
import eslint4b, {
  requireESLintUseAtYourOwnRisk4b,
  // @ts-ignore
} from "vite-plugin-eslint4b";

const config: UserConfig = {
  plugins: [
    eslint4b(), // <-
    requireESLintUseAtYourOwnRisk4b(),
  ],
  resolve: {
    alias: {
      globby: path.join(__dirname, "./src/shim/empty.ts"),
      "fast-glob": path.join(__dirname, "./src/shim/empty.ts"),
      fs: path.join(__dirname, "./src/shim/empty.ts"),
      typescript: path.join(__dirname, "./src/shim/typescript"),
    },
  },
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        espree: "src/espree.ts",
        eslint: "src/eslint.ts",
        "eslint-utils": "src/eslint-utils.ts",
      },
      formats: ["es"],
    },
  },
};
export default config;
