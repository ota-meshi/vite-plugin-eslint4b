import { Linter } from "eslint";
// @ts-expect-error -- for test
import { name } from "eslint/package.json";
import * as TSESLintUtils from "@typescript-eslint/utils";
import * as TSESLintPlugin from "@typescript-eslint/eslint-plugin";

const linter = new Linter({});

export function lint(): Linter.LintMessage[] {
  return linter.verify("const a = 1", [
    {
      rules: { semi: "error" },
    },
  ]);
}

export function getName(): string {
  return name;
}

export { TSESLintUtils, TSESLintPlugin };

export function getRules(): Map<any, any> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- Test
  return require("eslint/use-at-your-own-risk").builtinRules;
}
