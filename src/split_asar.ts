import fs from "fs";
import path from "path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const asar = require("@electron/asar");

/**
 * 将依赖打包成单独asar文件
 * @param {string} appOutDir
 */
async function archivedNodeModule(appOutDir: string): Promise<void> {
  const depsAsarName = "deps.asar";
  const modulesDir = path.join(appOutDir, "resources", "app", "node_modules");
  const appDir = path.join(appOutDir, "resources", "app");
  const destDepsAsarPath = path.join(appOutDir, "resources", depsAsarName);
  const destAppAsarPath = path.join(appOutDir, "resources", "app.asar");
  await asar.createPackage(modulesDir, destDepsAsarPath);

  // 删除所有的node_modules文件
  await fs.promises.rm(modulesDir, { recursive: true, force: true });
  await asar.createPackage(appDir, destAppAsarPath);
  await fs.promises.rm(appDir, { recursive: true, force: true });
}

export default async function (
  context: import("app-builder-lib").AfterPackContext,
): Promise<void> {
  const { appOutDir } = context;

  await Promise.all([archivedNodeModule(appOutDir)]);
  const afterSign = process.env["_afterSign"];
  if (afterSign) {
    try {
      const afterSignFn = require(path.resolve(afterSign));
      await afterSignFn(context);
    } catch (error) {
      console.error(error);
    }
  }
}
