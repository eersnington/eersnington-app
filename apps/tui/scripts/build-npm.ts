import { readFile, rm } from "node:fs/promises";
import { currentTarget } from "./package-targets";
import { writeNativePackage } from "./write-native-package";

const packageRoot = new URL("..", import.meta.url);
const distRoot = new URL("dist/", packageRoot);
const target = currentTarget();
const cargoBinary = new URL("target/release/eersnington-tui", packageRoot);
const nativeRoot = new URL("npm/native/", packageRoot);
const packageJson = JSON.parse(await readFile(new URL("package.json", packageRoot), "utf8")) as {
  readonly version: string;
};

await rm(distRoot, { force: true, recursive: true });
await rm(nativeRoot, { force: true, recursive: true });

const build = Bun.spawn(["cargo", "build", "--release", "--manifest-path", "Cargo.toml"], {
  cwd: packageRoot.pathname,
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await build.exited;
if (exitCode !== 0) {
  console.error(`cargo build failed with exit code ${exitCode}. dist was not updated.`);
  process.exit(exitCode);
}

await writeNativePackage({
  packageRoot,
  target,
  version: packageJson.version,
  sourceBinary: cargoBinary,
});

await import("./write-cli");
