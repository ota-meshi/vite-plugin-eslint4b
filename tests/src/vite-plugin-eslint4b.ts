import path from "path";
import cp from "child_process";
import assert from "assert";
import semver from "semver";
import type { Linter } from "eslint";

const dynamicImport = new Function("file", "return import(file)");
describe("Build with Vite", () => {
  if (
    !semver.satisfies(
      process.version,
      "^18.18.0 || ^20.9.0 || >=21.1.018.0.0 || ",
    )
  ) {
    return;
  }
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
    const APP_ROOT = path.join(__dirname, "../fixtures/build-test");

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
