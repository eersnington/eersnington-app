#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const platform = process.platform;
const arch = process.arch;
const extension = platform === "win32" ? ".exe" : "";
const report = process.report?.getReport();
const libc = platform === "linux" && !report?.header?.glibcVersionRuntime ? "-musl" : "";
const binary = join(
  dirname(fileURLToPath(import.meta.url)),
  "bin",
  `${platform}-${arch}${libc}`,
  `eersnington${extension}`,
);

if (!existsSync(binary)) {
  console.error(
    `Unsupported platform or missing binary: ${platform}-${arch}. Reinstall the package or open an issue with your platform details.`,
  );
  process.exit(1);
}

const result = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });

if (result.error) {
  console.error(`Failed to start eersnington: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
