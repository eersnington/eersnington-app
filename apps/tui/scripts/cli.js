#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const platform = process.platform;
const arch = process.arch;
const report = process.report?.getReport();
const libc = platform === "linux" && !report?.header?.glibcVersionRuntime ? "musl" : "gnu";
const nativePackageName = getNativePackageName(platform, arch, libc);
const require = createRequire(import.meta.url);

if (!nativePackageName) {
  console.error(
    `Unsupported platform: ${platform}-${arch}. Open an issue with your platform details if you need support.`,
  );
  process.exit(1);
}

let binary;
try {
  binary = require.resolve(`${nativePackageName}/bin/eersnington`);
} catch {
  console.error(
    `Missing native package for ${platform}-${arch}${platform === "linux" ? `-${libc}` : ""}. Reinstall eersnington with optional dependencies enabled, or install ${nativePackageName} manually.`,
  );
  process.exit(1);
}

const result = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });

if (result.error) {
  console.error(`Failed to start eersnington: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

function getNativePackageName(platform, arch, libc) {
  if (platform === "darwin" && arch === "arm64") {
    return "@eersnington/tui-darwin-arm64";
  }

  if (platform === "darwin" && arch === "x64") {
    return "@eersnington/tui-darwin-x64";
  }

  if (platform === "linux" && arch === "arm64" && libc === "musl") {
    return "@eersnington/tui-linux-arm64-musl";
  }

  if (platform === "linux" && arch === "x64" && libc === "musl") {
    return "@eersnington/tui-linux-x64-musl";
  }

  if (platform === "linux" && arch === "arm64") {
    return "@eersnington/tui-linux-arm64-gnu";
  }

  if (platform === "linux" && arch === "x64") {
    return "@eersnington/tui-linux-x64-gnu";
  }

  return undefined;
}
