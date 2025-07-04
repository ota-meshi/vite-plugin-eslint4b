import myPlugin from "@ota-meshi/eslint-plugin";

export default [
  {
    ignores: [
      "!.vscode/",
      "!.github/",
      ".nyc_output/",
      "coverage/",
      "lib/",
      "**/node_modules/",
      "tests/fixtures/build-test/dist/",
      "tests/fixtures/build-test-v8/dist/",
      ".vite-plugin-eslint4b-temp/",
    ],
  },
  ...myPlugin.config({
    node: true,
    ts: true,
    prettier: true,
    packageJson: true,
    json: true,
    yaml: true,
  }),
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: true,
      },
    },
    rules: {
      "no-lonely-if": "off",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "off",
      "no-warning-comments": "warn",
      "jsdoc/require-jsdoc": "off",
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/naming-convention": "off",
      "no-implicit-globals": "off",
    },
  },
  {
    files: ["scripts/**/*.ts", "tests/**/*.ts"],
    rules: {
      "no-console": "off",
      "jsdoc/require-jsdoc": "off",
      "@typescript-eslint/no-duplicate-enum-values": "off",
    },
  },
];
