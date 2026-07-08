import { constants } from "node:fs";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { nativeTargets, type NativeTarget } from "./package-targets";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const binEntry = "./dist/cli.js";
const nodeShebang = "#!/usr/bin/env node";
const requireDist = process.env.REQUIRE_DIST !== "0";
const requireAllNativeBinaries = process.env.REQUIRE_ALL_NATIVE_BINARIES === "1";

const packageJsonPath = join(packageRoot, "package.json");
const launcherPath = join(packageRoot, "dist", "cli.js");
const binRoot = join(packageRoot, "dist", "bin");

type PackageJson = {
  readonly bin?: Record<string, string>;
  readonly files?: readonly string[];
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

for (const publishedFile of ["dist", "README.md"] as const) {
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

if (!(await exists(binRoot))) {
  if (requireDist) {
    die("dist/bin is missing. Run bun run build before checking the package.");
  }
  process.exit(0);
}

const targetsToCheck = requireAllNativeBinaries
  ? nativeTargets
  : await Promise.all(
      (await readdir(binRoot)).map(async (platform) => {
        const directory = join(binRoot, platform);
        if (!(await stat(directory)).isDirectory()) {
          return null;
        }

        return (
          nativeTargets.find((target) => target.platform === platform) ?? {
            platform,
            binary: platform.startsWith("win32-") ? "eersnington.exe" : "eersnington",
            executable: !platform.startsWith("win32-"),
          }
        );
      }),
    );

for (const target of targetsToCheck) {
  if (!target) {
    continue;
  }

  const binaryPath = join(packageRoot, "dist", "bin", target.platform, target.binary);
  if (!(await exists(binaryPath))) {
    die(`Missing native binary: dist/bin/${target.platform}/${target.binary}.`);
  }

  await assertExecutable(binaryPath, target);
}
