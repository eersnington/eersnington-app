#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const platform = process.platform;
const arch = process.arch;
const report = process.report?.getReport();
const libc = platform === "linux" && !report?.header?.glibcVersionRuntime ? "musl" : "gnu";
const nativePackageName = getNativePackageName(platform, arch, libc);
const require = createRequire(import.meta.url);
const packageVersion = getPackageVersion();

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
  const packageWithVersion = packageVersion
    ? `${nativePackageName}@${packageVersion}`
    : nativePackageName;
  console.error(
    `Missing native package ${nativePackageName} for ${platform}-${arch}${platform === "linux" ? `-${libc}` : ""}.\n` +
      "The eersnington wrapper installed, but your package manager did not install the platform optional dependency.\n" +
      `Try reinstalling with optional dependencies enabled, or install ${packageWithVersion} manually.\n` +
      `If you use a package release-age policy, exclude eersnington and ${nativePackageName} from that policy.`,
  );
  process.exit(1);
}

if (process.argv[2] === "--version" || process.argv[2] === "-v") {
  console.log(packageVersion ?? "unknown");
  process.exit(0);
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

function getPackageVersion() {
  try {
    return require("../package.json").version;
  } catch {
    return undefined;
  }
}
