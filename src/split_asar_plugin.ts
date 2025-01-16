import { type ResolvedConfig } from "vite";

const split_flag = `__split_deps_asar_plugin__`;
const startSymbol = `if(!process["${split_flag}"]){`;
const endSymbol = `process["${split_flag}"] = true;\n}`;
const splitasarModuleCode = [
  `const path = require("path");`,
  `const fs = require("fs");`,
  `const resDir = path.join(path.parse(process.execPath).dir, "resources");`,
  `const Module = require("module");`,
  `const deps = fs`,
  `  .readdirSync(resDir)`,
  `  .filter((item) => item.endsWith(".asar") && item.startsWith("deps"))`,
  `  .map((item) => path.join(resDir, item));`,
  `const originLoad = Module._load;`,
  `Module._load = function (request, parent, isMain) {`,
  `  const module = require.cache[request];`,
  `  if (module && module.exports) {`,
  `    return module.exports;`,
  `  }`,
  `  parent.paths = parent.paths.concat(deps);`,
  `  const mod = originLoad.apply(this, [request, parent, isMain]);`,
  `  return mod;`,
  `};`,
];

export interface SplitAsarPluginOptions {
  splitDep?: boolean;
  moduleAlias?: Record<string, string>;
}

export function splitAsarPlugin(
  option: SplitAsarPluginOptions = { splitDep: true },
): any {
  let config: ResolvedConfig;
  let useInRenderer = false;
  const moduleAlias = option.moduleAlias || {};
  const aliasModuleCode = [
    "const Module20250107 = require('module');",
    "const originalResolveFilename20250107 = Module20250107._resolveFilename;",
    `const Mapper = ${JSON.stringify(moduleAlias)};`,
    "Module20250107._resolveFilename = function (request, parent, isMain, options) { ",
    "  request = Mapper[request] ?? request",
    "  return originalResolveFilename20250107.call(this, request, parent, isMain, options);",
    "};",
  ];
  return {
    name: "vite:bubuzi_split_asar",
    configResolved(resolvedConfig): void {
      config = resolvedConfig;
      useInRenderer = config.plugins.some(
        (p) => p.name === "vite:electron-renderer-preset-config",
      );
    },
    generateBundle(options, output): void {
      if (options.format === "es" || useInRenderer) {
        return;
      }
      const bundles = Object.keys(output).filter((item) =>
        item.endsWith(".js"),
      );
      const depsCode = option.splitDep ? splitasarModuleCode.join("\n") : "";
      const aliasCode = option.moduleAlias ? aliasModuleCode.join("\n") : "";
      const codeContent = [startSymbol, depsCode, aliasCode, endSymbol];
      for (const name of bundles) {
        const chunk = output[name];
        if (chunk.type !== "chunk") {
          continue;
        }

        const _code = chunk.code;
        const lines = _code.split("\n");
        if (lines.length < 1) {
          continue;
        }
        const newLines = [lines[0], ...codeContent, ...lines.slice(1)];
        const newCode = newLines.join("\n");
        chunk.code = newCode;
      }
    },
  };
}
