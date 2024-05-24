import type { Plugin as VitePlugin, UserConfig } from "vite";
import { createFilter } from "vite";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import esbuild from "esbuild";
import { fileURLToPath } from "url";
import MagicString from "magic-string";

const filename = import.meta.url ? fileURLToPath(import.meta.url) : __filename;
const dirname = path.dirname(filename);

const baseVirtualModuleId = "virtual:eslint4b";
const virtualESLintModuleId = `${baseVirtualModuleId}_eslint`;
const resolvedVirtualESLintModuleId = `\0${virtualESLintModuleId}`;
const virtualLinterModuleId = `${baseVirtualModuleId}_eslint_linter`;
const resolvedVirtualLinterModuleId = `\0${virtualLinterModuleId}`;
const virtualSourceCodeModuleId = `${baseVirtualModuleId}_eslint_source_code`;
const resolvedVirtualSourceCodeModuleId = `\0${virtualSourceCodeModuleId}`;
const virtualRulesModuleId = `${baseVirtualModuleId}_eslint_rules`;
const resolvedVirtualRulesModuleId = `\0${virtualRulesModuleId}`;
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
  [virtualRulesModuleId]: resolvedVirtualRulesModuleId,
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

const virtualUseAtYourOwnRisk = `import rules from '${virtualRulesModuleId}';
export const builtinRules = rules;
export const LegacyESLint = class FakeLegacyESLint {}
export const FlatESLint = class FakeFlatESLint {}
export default {
  builtinRules,
  LegacyESLint,
  FlatESLint
};
`;

function resolveAndNormalizePath(...paths: string[]) {
  return path.normalize(path.resolve(...paths));
}

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
      result.resolve.alias["eslint/use-at-your-own-risk"] =
        virtualUseAtYourOwnRiskModuleId;
      result.resolve.alias.eslint = virtualESLintModuleId;

      if (!hasAlias("path")) {
        result.resolve.alias.path = path.normalize(path.join(dirname, "../shim/path-shim.mjs"));
      }
      if (!hasAlias("fs")) {
        result.resolve.alias.fs = path.normalize(path.join(dirname, "../shim/fs-shim.mjs"));
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
    resolveId(source, _importer) {
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
      if (id === resolvedVirtualRulesModuleId) {
        return buildRules();
      }

      return undefined;
    },
  };
}

export interface RequireESLintUseAtYourOwnRisk4bOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
}

export function requireESLintUseAtYourOwnRisk4b(options?: {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
}): VitePlugin {
  const filter = createFilter(
    options?.include,
    options?.exclude ?? [/(^|\/)node_modules\//u],
  );
  return {
    name: "vite-plugin-require('eslint/use-at-your-own-risk')4b",
    transform(code, id) {
      const [filename] = id.split(`?`, 2);
      if (!filter(filename)) return undefined;
      const re = /require\s*\(\s*(["'])eslint\/use-at-your-own-risk\1\s*\)/gu;
      if (re.test(code)) {
        const ms = new MagicString(code);
        ms.prepend(
          `import { builtinRules as ___builtinRules___ } from '${virtualUseAtYourOwnRiskModuleId}';\n`,
        );
        re.lastIndex = 0;
        ms.replaceAll(re, "{ builtinRules: ___builtinRules___ }");
        return {
          code: ms.toString(),
          map: ms.generateMap(),
        };
      }
      return undefined;
    },
  };
}

function requireResolved(targetPath: string) {
  try {
    return createRequire(
      path.join(process.cwd(), "__placeholder__.js"),
    ).resolve(targetPath);
  } catch {
    // ignore
  }
  return createRequire(filename).resolve(targetPath);
}

function buildLinter() {
  const eslintPackageJsonPath = requireResolved("eslint/package.json");
  const linterPath = resolveAndNormalizePath(
    eslintPackageJsonPath,
    "../lib/linter/linter.js",
  );
  const rulesPath = resolveAndNormalizePath(
    eslintPackageJsonPath,
    "../lib/rules/index.js",
  );
  const code = build(
    linterPath,
    ["path", "node:path", "assert", "node:assert", "util"],
    {
      [rulesPath]: virtualRulesModuleId,
    },
  );
  return code;
}

function buildSourceCode() {
  const eslintPackageJsonPath = requireResolved("eslint/package.json");
  const sourceCodePath = resolveAndNormalizePath(
    eslintPackageJsonPath,
    "../lib/source-code/index.js",
  );
  return build(sourceCodePath, ["path", "node:path", "assert", "node:assert"]);
}

function buildRules() {
  const eslintPackageJsonPath = requireResolved("eslint/package.json");
  const rulesPath = resolveAndNormalizePath(
    eslintPackageJsonPath,
    "../lib/rules/index.js",
  );
  return build(rulesPath, ["path", "node:path"]);
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

function build(
  input: string,
  externals: string[],
  alias: Record<string, string> = {},
) {
  const bundledCode = bundle(input, externals, alias);
  return transform(bundledCode, externals, alias);
}

function bundle(
  entryPoint: string,
  externals: string[],
  alias: Record<string, string>,
) {
  const external = [...externals, ...Object.keys(alias)];
  const result = esbuild.buildSync({
    entryPoints: [entryPoint],
    format: "esm",
    bundle: true,
    external,
    write: false,
    inject: [path.normalize(path.join(dirname, "../shim/process-shim.mjs"))],
  });

  return result.outputFiles[0].text;
}

function transform(
  code: string,
  injects: string[],
  alias: Record<string, string>,
) {
  const injectSources: { id: string; source: string; module: string }[] = [
    ...injects.map((inject) => ({
      id: `$inject_${inject.replace(/[^\w$]/giu, "_")}`,
      source: inject.replace(/^node:/u, ""),
      module: inject,
    })),
    ...Object.entries(alias).map(([module, source]) => ({
      id: `$inject_${module.replace(/[^\w$]/giu, "_")}`,
      source,
      module,
    })),
  ];

  injectSources.forEach((s) => {
    if (path.isAbsolute(s.module)) {
      s.module = path.normalize(`./${path.relative(process.cwd(), s.module)}`);
    }
  });

  return `
${injectSources
  .map(({ id, source }) => `import ${id} from '${source}';`)
  .join("\n")}
const $_injects_$ = {${injectSources
    .map(({ id, module }) => `${JSON.stringify(module)}:${id}`)
    .join(",\n")}};
function require(module) {
	const mod = $_injects_$[module]
	return mod.default || mod
}
${code}
`;
}
