import { Linter } from "eslint";
// @ts-expect-error -- for test
import { name } from "eslint/package.json";
import * as TSESLintUtils from "@typescript-eslint/utils";
import * as TSESLintPlugin from "@typescript-eslint/eslint-plugin";

const linter = new Linter();

export function lint(): Linter.LintMessage[] {
  return linter.verify("const a = 1", [
    {
      languageOptions: {
        ecmaVersion: 2020,
      },
      rules: { semi: "error" },
    },
  ]);
}

export function getName(): string {
  return name;
}

export { TSESLintUtils, TSESLintPlugin };

export function getRules() {
  return require("eslint/use-at-your-own-risk").builtinRules;
}
