import { createRequire } from "node:module";
import { LogLevel } from "vite";
import { name as pkgName } from "../package.json";
import yml from "js-yaml";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);

export interface DevCLIOptions {
  inspect?: boolean | string;
  inspectBrk?: boolean | string;
  remoteDebuggingPort?: string;
  noSandbox?: boolean;
  rendererOnly?: boolean;
  win?: boolean | string;
  mac?: boolean | string;
  linux?: boolean | string;
}

export interface GlobalCLIOptions {
  "--"?: string[];
  c?: boolean | string;
  config?: string;
  l?: LogLevel;
  logLevel?: LogLevel;
  clearScreen?: boolean;
  d?: boolean | string;
  debug?: boolean | string;
  f?: string;
  filter?: string;
  m?: string;
  mode?: string;
  ignoreConfigWarning?: boolean;
  sourcemap?: boolean;
  w?: boolean;
  watch?: boolean;
  outDir?: string;
  entry?: string;
}

export async function doBuild(
  root: string,
  options: DevCLIOptions & GlobalCLIOptions,
): Promise<void> {
  root = root ?? "";
  const entry = require.resolve(pkgName);
  const modulePath = path.parse(entry).dir;

  const { Packager, Platform } = require("app-builder-lib");
  const {
    getConfig,
    validateConfig,
  } = require("app-builder-lib/out/util/config");
  const {
    createElectronFrameworkSupport,
  } = require("app-builder-lib/out/electron/ElectronFramework.js");

  let platform = Platform.current();
  if (options.win) {
    platform = Platform.WINDOWS;
  } else if (options.mac) {
    platform = Platform.MAC;
  } else if (options.linux) {
    platform = Platform.LINUX;
  }
  let ymlPath = path.join(root, "electron-builder.yml");
  if (options.config) {
    ymlPath = options.config;
  }
  if (!fs.existsSync(ymlPath)) {
    throw new Error(
      `not found electron-builder.yml in ${path.join(root, ymlPath)}`,
    );
  }
  const content = await fs.promises.readFile(ymlPath, "utf8");
  const originConfig = yml.load(content);
  const afterSign = originConfig.afterSign;
  if (afterSign) {
    process.env["_afterSign"] = afterSign;
  }

  const map = new Map();
  map.set(platform, new Map());

  // @ts-ignore electron-config
  const buildOptions = {
    targets: map,
    config: undefined,
  };
  yml.load();
  buildOptions.config = await getConfig(process.cwd(), ymlPath, {
    asar: false,
    afterSign: path.join(modulePath, "split_asar.cjs"),
  });
  const packager = new Packager(buildOptions);
  validateConfig(buildOptions.config, packager.debugLogger);
  const framework = await createElectronFrameworkSupport(
    buildOptions.config,
    packager,
  );
  Reflect.set(packager, "_framework", framework);
  await packager.build();
}
