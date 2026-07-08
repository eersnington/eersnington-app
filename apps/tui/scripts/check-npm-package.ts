import { constants } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { nativeTargets, type NativeTarget } from "./package-targets";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const binEntry = "./dist/cli.js";
const nodeShebang = "#!/usr/bin/env node";
const requireDist = process.env.REQUIRE_DIST !== "0";
const requireAllNativePackages =
  process.env.REQUIRE_ALL_NATIVE_PACKAGES === "1" ||
  process.env.REQUIRE_ALL_NATIVE_BINARIES === "1";

const packageJsonPath = join(packageRoot, "package.json");
const launcherPath = join(packageRoot, "dist", "cli.js");
const nativeRoot = join(packageRoot, "npm", "native");

type PackageJson = {
  readonly bin?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
  readonly files?: readonly string[];
  readonly name?: string;
  readonly version?: string;
  readonly os?: readonly string[];
  readonly cpu?: readonly string[];
  readonly libc?: readonly string[];
};

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function assertExecutable(path: string, target?: NativeTarget): Promise<void> {
  if (process.platform === "win32" || target?.executable === false) {
    return;
  }

  try {
    await access(path, constants.X_OK);
  } catch {
    die(`${path} is not executable. Rebuild the package artifacts before publishing.`);
  }
}

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;

for (const command of ["eersnington", "sreenarayanan"] as const) {
  if (packageJson.bin?.[command] !== binEntry) {
    die(`package.json must expose bin.${command} as "${binEntry}".`);
  }
}

for (const publishedFile of ["dist/cli.js", "README.md"] as const) {
  if (!packageJson.files?.includes(publishedFile)) {
    die(`package.json files must include "${publishedFile}".`);
  }
}

for (const sourceFile of ["Cargo.toml", "README.md"] as const) {
  if (!(await exists(join(packageRoot, sourceFile)))) {
    die(`${sourceFile} is missing from apps/tui.`);
  }
}

if (!(await exists(launcherPath))) {
  if (requireDist) {
    die("dist/cli.js is missing. Run bun run build before checking the package.");
  }
  process.exit(0);
}

const launcher = await readFile(launcherPath, "utf8");
if (!launcher.startsWith(nodeShebang)) {
  die("dist/cli.js must start with a Node shebang.");
}
await assertExecutable(launcherPath);

if (!(await exists(nativeRoot))) {
  if (requireDist) {
    die("npm/native is missing. Run bun run build before checking the package.");
  }
  process.exit(0);
}

const targetsToCheck = requireAllNativePackages
  ? nativeTargets
  : (await readdir(nativeRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => nativeTargets.find((target) => target.platform === entry.name) ?? null);

for (const target of targetsToCheck) {
  if (!target) {
    continue;
  }

  const nativePackagePath = join(packageRoot, "npm", "native", target.platform, "package.json");
  if (!(await exists(nativePackagePath))) {
    die(`Missing native package manifest: npm/native/${target.platform}/package.json.`);
  }

  const nativePackage = JSON.parse(await readFile(nativePackagePath, "utf8")) as PackageJson;
  if (nativePackage.name !== target.packageName) {
    die(`npm/native/${target.platform}/package.json must be named ${target.packageName}.`);
  }

  if (nativePackage.version !== packageJson.version) {
    die(`npm/native/${target.platform}/package.json version must match the main package version.`);
  }

  if (JSON.stringify(nativePackage.os) !== JSON.stringify(target.os)) {
    die(`npm/native/${target.platform}/package.json has the wrong os constraint.`);
  }

  if (JSON.stringify(nativePackage.cpu) !== JSON.stringify(target.cpu)) {
    die(`npm/native/${target.platform}/package.json has the wrong cpu constraint.`);
  }

  if (JSON.stringify(nativePackage.libc) !== JSON.stringify(target.libc)) {
    die(`npm/native/${target.platform}/package.json has the wrong libc constraint.`);
  }

  const binaryPath = join(packageRoot, "npm", "native", target.platform, "bin", target.binary);
  if (!(await exists(binaryPath))) {
    die(`Missing native binary: npm/native/${target.platform}/bin/${target.binary}.`);
  }

  await assertExecutable(binaryPath, target);
}

if (requireAllNativePackages) {
  for (const target of nativeTargets) {
    if (packageJson.optionalDependencies?.[target.packageName] !== packageJson.version) {
      die(
        `package.json optionalDependencies.${target.packageName} must equal ${packageJson.version}.`,
      );
    }
  }
}
