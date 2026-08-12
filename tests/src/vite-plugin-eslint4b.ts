import assert from "assert";
import eslint4b, {
  requireESLintUseAtYourOwnRisk4b,
} from "../../src/vite-plugin-eslint4b";

describe("vite-plugin-eslint4b config", () => {
  it("excludes ESLint entry points from dependency optimization", async () => {
    const configHook = eslint4b().config;
    if (typeof configHook !== "function") {
      throw new TypeError("Expected the config hook to be a function.");
    }

    const result = await configHook.call(
      {} as never,
      {},
      { command: "serve", mode: "test" },
    );

    assert.deepStrictEqual(result?.optimizeDeps?.exclude, [
      "eslint",
      "eslint/use-at-your-own-risk",
    ]);
  });

  it("respects regular expression aliases for path and fs", async () => {
    const configHook = eslint4b().config;
    if (typeof configHook !== "function") {
      throw new TypeError("Expected the config hook to be a function.");
    }

    const result = await configHook.call(
      {} as never,
      {
        resolve: {
          alias: [
            { find: /^(node:)?path$/u, replacement: "/path-browserify.js" },
            { find: /^(node:)?fs$/u, replacement: "/fs-browserify.js" },
          ],
        },
      },
      { command: "serve", mode: "test" },
    );

    assert.ok(result?.resolve?.alias);
    assert.ok(!Array.isArray(result.resolve.alias));
    for (const moduleName of ["path", "node:path", "fs", "node:fs"]) {
      assert.ok(!(moduleName in result.resolve.alias));
    }
  });

  it("rewrites CommonJS access to ESLint builtin rules", async () => {
    const transformHook = requireESLintUseAtYourOwnRisk4b().transform;
    if (typeof transformHook !== "function") {
      throw new TypeError("Expected the transform hook to be a function.");
    }

    const result = await transformHook.call(
      {} as never,
      `const { builtinRules } = require("eslint/use-at-your-own-risk");`,
      "/entry.js",
    );

    assert.ok(result && typeof result !== "string");
    if (typeof result.code !== "string") {
      throw new TypeError("Expected transformed code.");
    }
    assert.match(result.code, /builtinRules as ___builtinRules___/u);
    const map = result.map;
    if (typeof map !== "string") {
      throw new TypeError("Expected a JSON source map string.");
    }
    assert.doesNotThrow(() => JSON.parse(map));
  });
});
