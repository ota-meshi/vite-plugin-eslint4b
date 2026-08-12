import assert from "assert";
import eslint4b from "../../src/vite-plugin-eslint4b";

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
});
