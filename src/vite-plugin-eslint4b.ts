import type { Plugin as VitePlugin, UserConfig } from "vite";
import { createFilter } from "vite";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import type { OutputChunk } from "rolldown";
import { rolldown } from "rolldown";
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
const virtualESLintModuleTempIdPrefix = `${baseVirtualModuleId}_eslint_temp_`;
const resolvedVirtualESLintModuleTempIdPrefix = `\0${virtualESLintModuleTempIdPrefix}`;
const resolvedVirtualPackageJsonModuleId = `\0${virtualPackageJsonModuleId.replace(
  /\./gu,
  "_",
)}`;
const virtualUseAtYourOwnRiskModuleId = `${virtualESLintModuleId}/use-at-your-own-risk`;
const resolvedVirtualUseAtYourOwnRiskModuleId = `\0${virtualUseAtYourOwnRiskModuleId.replace(
  /\./gu,
  "_",
)}`;

const virtualModuleIds = [
  virtualESLintModuleId,
  virtualLinterModuleId,
  virtualSourceCodeModuleId,
  virtualRulesModuleId,
  virtualPackageJsonModuleId,
  virtualUseAtYourOwnRiskModuleId,
];

const resolveIds: Record<string, string | undefined> = {
  [virtualESLintModuleId]: resolvedVirtualESLintModuleId,
  [virtualLinterModuleId]: resolvedVirtualLinterModuleId,
  [virtualSourceCodeModuleId]: resolvedVirtualSourceCodeModuleId,
  [virtualRulesModuleId]: resolvedVirtualRulesModuleId,
  [virtualPackageJsonModuleId]: resolvedVirtualPackageJsonModuleId,
  [virtualUseAtYourOwnRiskModuleId]: resolvedVirtualUseAtYourOwnRiskModuleId,
};
type BundledESLint = {
  resolveIds: Record<string, string | undefined>;
  load: (id: string) => string | undefined;
};
let loadingBundledESLint: Promise<BundledESLint> | null = null;
let bundledESLint: BundledESLint | null = null;

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

      for (const pathName of ["path", "node:path"]) {
        if (!hasAlias(pathName)) {
          result.resolve.alias[pathName] = path.normalize(
            path.join(dirname, "../shim/path-shim.mjs"),
          );
        }
      }
      for (const pathName of ["fs", "node:fs"]) {
        if (!hasAlias(pathName)) {
          result.resolve.alias[pathName] = path.normalize(
            path.join(dirname, "../shim/fs-shim.mjs"),
          );
        }
      }

      if (config.define?.["process.env.NODE_DEBUG"] === undefined) {
        // Required for the 'utils' package to work in the browser.
        result.define["process.env.NODE_DEBUG"] = false;
      }

      result.optimizeDeps = result.optimizeDeps || {};
      result.optimizeDeps.include = result.optimizeDeps.include || [];
      result.optimizeDeps.include.push(
        "@eslint-community/eslint-utils",
        "@eslint-community/regexpp",
        "eslint-scope",
        "eslint-visitor-keys",
        "espree",
        "esquery",
      );

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
    async resolveId(source, _importer) {
      if (virtualModuleIds.includes(source)) {
        if (!loadingBundledESLint) loadingBundledESLint = buildESLint();
        if (!bundledESLint) {
          // eslint-disable-next-line require-atomic-updates -- ok
          bundledESLint = await loadingBundledESLint;
        }
      }
      return resolveIds[source] || bundledESLint?.resolveIds[source];
    },
    load(id, _options) {
      if (id === resolvedVirtualESLintModuleId) {
        return virtualEslintCode;
      }
      if (id === resolvedVirtualPackageJsonModuleId) {
        return buildPackageJSON();
      }
      if (id === resolvedVirtualUseAtYourOwnRiskModuleId) {
        return virtualUseAtYourOwnRisk;
      }
      return bundledESLint?.load(id) || undefined;
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

async function buildESLint(): Promise<BundledESLint> {
  const eslintPackageJsonPath = requireResolved("eslint/package.json");
  const linterPath = resolveAndNormalizePath(
    eslintPackageJsonPath,
    "../lib/linter/linter.js",
  );
  const rulesPath = resolveAndNormalizePath(
    eslintPackageJsonPath,
    "../lib/rules/index.js",
  );
  let sourceCodePath = resolveAndNormalizePath(
    eslintPackageJsonPath,
    "../lib/source-code/index.js",
  );
  if (!fs.existsSync(sourceCodePath)) {
    // ESLint v9.5.0 and later
    sourceCodePath = resolveAndNormalizePath(
      eslintPackageJsonPath,
      "../lib/languages/js/source-code/index.js",
    );
  }

  const entryPoints = [linterPath, rulesPath, sourceCodePath];
  const externals = [
    "path",
    "node:path",
    "assert",
    "node:assert",
    "util",
    "node:util",
    "@eslint-community/eslint-utils",
    "@eslint-community/regexpp",
    "eslint-scope",
    "eslint-visitor-keys",
    "espree",
    "esquery",
  ];
  const bundled = await bundle(entryPoints, externals);

  const idMap = bundled.map((file, i): [string, string, string] => {
    if (file.facadeModuleId === linterPath) {
      return [
        file.fileName,
        virtualLinterModuleId,
        resolvedVirtualLinterModuleId,
      ];
    }
    if (file.facadeModuleId === rulesPath) {
      return [
        file.fileName,
        virtualRulesModuleId,
        resolvedVirtualRulesModuleId,
      ];
    }
    if (file.facadeModuleId === sourceCodePath) {
      return [
        file.fileName,
        virtualSourceCodeModuleId,
        resolvedVirtualSourceCodeModuleId,
      ];
    }
    return [
      file.fileName,
      `${virtualESLintModuleTempIdPrefix}${i}`,
      `${resolvedVirtualESLintModuleTempIdPrefix}${i}`,
    ];
  });
  const alias = Object.fromEntries(idMap.map(([id, vId]) => [id, vId]));

  return {
    resolveIds: Object.fromEntries(
      idMap.map(([_, vId, resolvedVId]) => [vId, resolvedVId]),
    ),
    load(id) {
      const ids = idMap.find(([, , resolvedVId]) => resolvedVId === id);
      if (!ids) return undefined;
      const entry = bundled.find((file) => file.fileName === ids[0]);
      if (!entry) return undefined;

      const transformed1 = transformAliases(entry.code, alias);
      const transformed2 = transformExternalsToInjects(transformed1, externals);
      // For debug
      // const TEMP_DIR = path.join(dirname, "../.vite-plugin-eslint4b-temp");
      // const tempFilePath = path.join(TEMP_DIR, entry.fileName);
      // fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
      // fs.writeFileSync(tempFilePath, transformed2, "utf8");
      return transformed2;
    },
  };
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

async function bundle(entryPoints: string[], externals: string[]) {
  const build = await rolldown({
    input: entryPoints,
    external: externals,
    inject: {
      process: [
        path.normalize(path.join(dirname, "../shim/process-shim.mjs")),
        "*",
      ],
    },
  });

  const result = await build.generate({
    format: "esm",
  });
  return result.output as OutputChunk[];
}

function transformAliases(code: string, alias: Record<string, string>) {
  let result = code;
  for (const [from, to] of Object.entries(alias)) {
    // Replace only the first occurrence of the alias.
    const escaped = from.replace(/[$()*+.?[\\\]^{|}]/gu, "\\$&");
    const re = new RegExp(
      String.raw`(?<q>['"])\.[\.\/\\]*[\/\\]${escaped}\k<q>`,
      "u",
    );
    const match = re.exec(result);
    if (match) {
      const quote = match.groups!.q;
      const prefix = result.slice(0, match.index);
      const suffix = result.slice(match.index + match[0].length);
      result = `${prefix}${quote}${to}${quote}${suffix}`;
    }
  }
  return result;
}

function transformExternalsToInjects(code: string, injects: string[]) {
  const injectSources: { id: string; source: string; module: string }[] =
    injects.map((inject) => ({
      id: `$inject_${inject.replace(/[^\w$]/giu, "_")}`,
      source: inject.replace(/^node:/u, ""),
      module: inject,
    }));

  injectSources.forEach((s) => {
    if (path.isAbsolute(s.module)) {
      const normalized = path.normalize(path.relative(process.cwd(), s.module));
      s.module =
        normalized.startsWith("./") || normalized.startsWith("../")
          ? normalized
          : // This must be a relative path to match the esbuild import path.
            `./${normalized}`;
    }
  });

  return `
${injectSources
  .map(({ id, source }) => `import * as ${id} from '${source}';`)
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
