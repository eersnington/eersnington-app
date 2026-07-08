import { readFile, rm, writeFile } from "node:fs/promises";

import { nativePackageDependencies, nativeTargets } from "./package-targets";
import { writeNativePackage } from "./write-native-package";

const packageRoot = new URL("..", import.meta.url);
const packageJsonUrl = new URL("package.json", packageRoot);
const packageJson = JSON.parse(await readFile(packageJsonUrl, "utf8")) as {
  readonly version: string;
  readonly optionalDependencies?: Record<string, string>;
};
const version = process.env.INPUT_VERSION ?? packageJson.version;

await rm(new URL("npm/native/", packageRoot), { force: true, recursive: true });

await import("./write-cli");

for (const target of nativeTargets) {
  const binary = new URL(`dist/bin/${target.platform}/${target.binary}`, packageRoot);

  if (!(await Bun.file(binary).exists())) {
    console.error(`Missing required native binary: dist/bin/${target.platform}/${target.binary}.`);
    process.exit(1);
  }

  await writeNativePackage({
    packageRoot,
    target,
    version,
    sourceBinary: binary,
  });
}

if (process.env.INPUT_VERSION) {
  await writeFile(
    packageJsonUrl,
    `${JSON.stringify(
      {
        ...packageJson,
        version,
        optionalDependencies: nativePackageDependencies(version),
      },
      null,
      2,
    )}\n`,
  );
}
