import { cac } from "cac";
import { version } from "../package.json";
import { type DevCLIOptions, type GlobalCLIOptions, doBuild } from "./build";

const cli = cac("split-asar-builder");
cli
  .command("[root]", "build electron project")
  .option("--win", "Packaged for the Windows platform")
  .option("--mac", "Packaged for the Mac platform")
  .option("--linux", "Packaged for the Linux platform")
  .option("--config <config>", "electron-builder config file path")
  .action(async (root: string, options: DevCLIOptions & GlobalCLIOptions) => {
    await doBuild(root, options);
  });
cli.help();
cli.version(version);
cli.parse();
