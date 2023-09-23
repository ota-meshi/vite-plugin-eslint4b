import type { Plugin as VitePlugin, UserConfig } from "vite";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import esbuild from "esbuild";
import { fileURLToPath } from "url";

const filename = import.meta.url ? fileURLToPath(import.meta.url) : __filename;
const dirname = path.dirname(filename);

const baseVirtualModuleId = "virtual:eslint4b";
const virtualESLintModuleId = `${baseVirtualModuleId}_eslint`;
const resolvedVirtualESLintModuleId = `\0${virtualESLintModuleId}`;
const virtualLinterModuleId = `${baseVirtualModuleId}_eslint_linter`;
const resolvedVirtualLinterModuleId = `\0${virtualLinterModuleId}`;
const virtualSourceCodeModuleId = `${baseVirtualModuleId}_eslint_source_code`;
const resolvedVirtualSourceCodeModuleId = `\0${virtualSourceCodeModuleId}`;
const virtualPackageJsonModuleId = `${virtualESLintModuleId}/package.json`;
const resolvedVirtualPackageJsonModuleId = `\0${virtualPackageJsonModuleId.replace(
  /\./gu,
  "_",
)}`;
const virtualUseAtYourOwnRiskModuleId = `${virtualESLintModuleId}/use-at-your-own-risk`;
const resolvedVirtualUseAtYourOwnRiskModuleId = `\0${virtualUseAtYourOwnRiskModuleId.replace(
  /\./gu,
  "_",
)}`;

const resolveIds: Record<string, string | undefined> = {
  [virtualESLintModuleId]: resolvedVirtualESLintModuleId,
  [virtualLinterModuleId]: resolvedVirtualLinterModuleId,
  [virtualSourceCodeModuleId]: resolvedVirtualSourceCodeModuleId,
  [virtualPackageJsonModuleId]: resolvedVirtualPackageJsonModuleId,
  [virtualUseAtYourOwnRiskModuleId]: resolvedVirtualUseAtYourOwnRiskModuleId,
};

const virtualEslintCode = `import linter from '${virtualLinterModuleId}';
import sourceCode from '${virtualSourceCodeModuleId}';
export const Linter = linter.Linter;
export const SourceCode = sourceCode.SourceCode;

// Avoid errors in extends class declarations.
export const RuleTester = class FakeRuleTester {};
export default {
  Linter,
  RuleTester,
  SourceCode
};
`;

const virtualUseAtYourOwnRisk = `import { Linter } from '${virtualESLintModuleId}';
export const builtinRules = new Linter().getRules();
export default {
  builtinRules
};
`;

export default function eslint4b(): VitePlugin {
  return {
    name: "vite-plugin-eslint4b",
    config: (config) => {
      const result: UserConfig & {
        resolve: { alias: { [find: string]: string } };
        define: Record<string, any>;
      } = {
        resolve: { alias: {} },
        define: {},
      };
      if (hasAlias("eslint")) {
        // eslint-disable-next-line no-console -- OK
        console.warn(
          "An eslint alias is specified but is ignored by vite-plugin-eslint4b.",
        );
      }
      result.resolve.alias.eslint = virtualESLintModuleId;

      if (!hasAlias("path")) {
        result.resolve.alias.path = path.join(dirname, "../shim/path-shim.mjs");
      }

      if (config.define?.["process.env.NODE_DEBUG"] === undefined) {
        // Required for the 'utils' package to work in the browser.
        result.define["process.env.NODE_DEBUG"] = false;
      }
      return result;

      function hasAlias(m: string) {
        const configAlias = config.resolve?.alias;
        if (!configAlias) {
          return false;
        }
        if (Array.isArray(configAlias)) {
          return configAlias.some((alias) => alias.find === m);
        }
        return (configAlias as { [find: string]: string })[m] != null;
      }
    },
    resolveId(source) {
      return resolveIds[source];
    },
    load(id, _options) {
      if (id === resolvedVirtualESLintModuleId) {
        return virtualEslintCode;
      }
      if (id === resolvedVirtualLinterModuleId) {
        return buildLinter();
      }
      if (id === resolvedVirtualSourceCodeModuleId) {
        return buildSourceCode();
      }
      if (id === resolvedVirtualPackageJsonModuleId) {
        return buildPackageJSON();
      }
      if (id === resolvedVirtualUseAtYourOwnRiskModuleId) {
        return virtualUseAtYourOwnRisk;
      }

      return undefined;
    },
  };
}

function requireResolved(targetPath: string) {
  return createRequire(filename).resolve(targetPath);
}

function buildLinter() {
  const eslintPackageJsonPath = requireResolved("eslint/package.json");
  const linterPath = path.resolve(
    eslintPackageJsonPath,
    "../lib/linter/linter.js",
  );
  return build(linterPath, ["path", "assert", "util"]);
}

function buildSourceCode() {
  const eslintPackageJsonPath = requireResolved("eslint/package.json");
  const sourceCodePath = path.resolve(
    eslintPackageJsonPath,
    "../lib/source-code/index.js",
  );
  return build(sourceCodePath, ["path"]);
}

function buildPackageJSON() {
  const isId = /^[\p{ID_Start}$_][\p{ID_Continue}$\u200c\u200d]*$/u;

  const eslintPackageJsonPath = requireResolved("eslint/package.json");
  const json = JSON.parse(fs.readFileSync(eslintPackageJsonPath, "utf8"));
  const exports: string[] = [];
  const defaultExports: string[] = [];
  for (const [key, value] of Object.entries(json)) {
    if (isId.test(key)) {
      exports.push(`export const ${key} = ${JSON.stringify(value)};`);
      defaultExports.push(key);
    } else {
      defaultExports.push(`${JSON.stringify(key)}:${JSON.stringify(value)}`);
    }
  }
  return `${exports.join("\n")}
export default { ${defaultExports.join(", ")} };
`;
}

function build(input: string, externals: string[]) {
  const bundledCode = bundle(input, externals);
  return transform(bundledCode, externals);
}

function bundle(entryPoint: string, externals: string[]) {
  const result = esbuild.buildSync({
    entryPoints: [entryPoint],
    format: "esm",
    bundle: true,
    external: externals,
    write: false,
    inject: [path.join(dirname, "../shim/process-shim.mjs")],
  });

  return `${result.outputFiles[0].text}`;
}

function transform(code: string, injects: string[]) {
  return `
${injects
  .map(
    (inject) =>
      `import $inject_${inject.replace(/-/g, "_")}$ from '${inject}';`,
  )
  .join("\n")}
const $_injects_$ = {${injects
    .map((inject) => `${inject.replace(/-/g, "_")}:$inject_${inject}$`)
    .join(",\n")}};
function require(module, ...args) {
	const mod = $_injects_$[module]
	return mod.default || mod
}
${code}
`;
}
