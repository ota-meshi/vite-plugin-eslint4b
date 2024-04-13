import path from "path";
import cp from "child_process";
import assert from "assert";
import type { Linter } from "eslint";

const dynamicImport = new Function("file", "return import(file)");
describe("Build with Vite with eslint v8", () => {
  let originalCwd: string;
  cp.execSync("npm run build", {
    stdio: "inherit",
  });

  before(() => {
    originalCwd = process.cwd();
  });
  after(() => {
    process.chdir(originalCwd);
  });
  it("basic", async () => {
    const APP_ROOT = path.join(__dirname, "../fixtures/build-test-v8");

    process.chdir(APP_ROOT);
    cp.execSync("npm i --no-package-lock -f", {
      stdio: "inherit",
    });
    cp.execSync(`npm run build`, { stdio: "inherit" });

    const mod = await dynamicImport(path.resolve(APP_ROOT, "./dist/index.js"));
    const result: Linter.LintMessage[] = mod.lint();
    console.log(result);

    assert.deepStrictEqual(
      result.map((report) => {
        return {
          ruleId: report.ruleId,
          message: report.message,
          line: report.line,
          column: report.column,
        };
      }),
      [
        {
          ruleId: "semi",
          message: "Missing semicolon.",
          line: 1,
          column: 12,
        },
      ],
    );

    const name: string = mod.getName();
    assert.strictEqual(name, "eslint");

    assert.ok(
      [...mod.getRules().keys()].length > 150,
      "Cannot get builtinRules",
    );
  });
});
