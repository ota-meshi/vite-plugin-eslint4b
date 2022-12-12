import { Linter } from "eslint";

const linter = new Linter();

export function test(): Linter.LintMessage[] {
  return linter.verify("const a = 1", {
    parserOptions: {
      ecmaVersion: 2020,
    },
    rules: { semi: "error" },
  });
}
