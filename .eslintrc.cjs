module.exports = {
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
    project: "./tsconfig.json",
  },
  extends: [
    "plugin:@ota-meshi/recommended",
    "plugin:@ota-meshi/+node",
    "plugin:@ota-meshi/+typescript",
    "plugin:@ota-meshi/+prettier",
    "plugin:@ota-meshi/+package-json",
    "plugin:@ota-meshi/+json",
    "plugin:@ota-meshi/+yaml",
  ],
  rules: {
    "no-lonely-if": "off",
    "no-shadow": "off",
    "no-warning-comments": "warn",
    "require-jsdoc": "off",
    "prettier/prettier": [
      "error",
      {},
      {
        usePrettierrc: true,
      },
    ],
  },
  overrides: [
    {
      files: ["*.json"],
      parser: "jsonc-eslint-parser",
    },
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
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
        "require-jsdoc": "off",
        "@typescript-eslint/no-duplicate-enum-values": "off",
      },
    },
  ],
};
