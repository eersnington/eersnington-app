import { chmod, copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { NativeTarget } from "./package-targets";

type NativePackageOptions = {
  readonly packageRoot: URL;
  readonly target: NativeTarget;
  readonly version: string;
  readonly sourceBinary: URL;
};

export async function writeNativePackage(options: NativePackageOptions): Promise<void> {
  const packageDirectory = new URL(`npm/native/${options.target.platform}/`, options.packageRoot);
  const binary = new URL(`bin/${options.target.binary}`, packageDirectory);

  await rm(packageDirectory, { force: true, recursive: true });
  await mkdir(dirname(binary.pathname), { recursive: true });
  await copyFile(options.sourceBinary, binary);

  if (options.target.executable) {
    await chmod(binary, 0o755);
  }

  const packageJson = {
    name: options.target.packageName,
    version: options.version,
    description: `Native binary for eersnington on ${options.target.platform}`,
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/eersnington/eersnington-app.git",
      directory: "apps/tui",
    },
    publishConfig: {
      access: "public",
    },
    os: options.target.os,
    cpu: options.target.cpu,
    ...(options.target.libc ? { libc: options.target.libc } : {}),
    files: ["bin"],
  };

  await writeFile(
    new URL("package.json", packageDirectory),
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}
