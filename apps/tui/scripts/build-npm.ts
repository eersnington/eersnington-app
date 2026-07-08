import { mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { currentTarget } from "./package-targets";

const packageRoot = new URL("..", import.meta.url);
const distRoot = new URL("dist/", packageRoot);
const target = currentTarget();
const extension = process.platform === "win32" ? ".exe" : "";
const cargoBinary = new URL(`target/release/eersnington-tui${extension}`, packageRoot);
const distBinary = new URL(`bin/${target.platform}/${target.binary}`, distRoot);

await rm(distRoot, { force: true, recursive: true });

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

await mkdir(dirname(distBinary.pathname), { recursive: true });
await Bun.write(distBinary, Bun.file(cargoBinary));

if (target.executable) {
  const chmod = Bun.spawn(["chmod", "755", distBinary.pathname], {
    stdout: "inherit",
    stderr: "inherit",
  });
  const chmodExitCode = await chmod.exited;
  if (chmodExitCode !== 0) {
    console.error(`chmod failed for ${distBinary.pathname} with exit code ${chmodExitCode}.`);
    process.exit(chmodExitCode);
  }
}

await import("./write-cli");
