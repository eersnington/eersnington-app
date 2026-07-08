import { mkdir } from "node:fs/promises";

const packageRoot = new URL("..", import.meta.url);
const source = new URL("cli.js", import.meta.url);
const destination = new URL("dist/cli.js", packageRoot);

await mkdir(new URL("dist/", packageRoot), { recursive: true });
await Bun.write(destination, Bun.file(source));

if (process.platform !== "win32") {
  const chmod = Bun.spawn(["chmod", "755", destination.pathname], {
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await chmod.exited;

  if (exitCode !== 0) {
    console.error(`chmod failed for dist/cli.js with exit code ${exitCode}.`);
    process.exit(exitCode);
  }
}
