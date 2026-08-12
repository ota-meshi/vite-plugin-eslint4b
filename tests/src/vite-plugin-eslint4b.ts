import assert from "assert";
import eslint4b from "../../src/vite-plugin-eslint4b";

describe("vite-plugin-eslint4b config", () => {
  it("respects regular expression aliases for path and fs", async () => {
    const configHook = eslint4b().config;
    assert.strictEqual(typeof configHook, "function");

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
