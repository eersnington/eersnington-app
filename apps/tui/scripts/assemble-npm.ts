import { nativeTargets } from "./package-targets";

const packageRoot = new URL("..", import.meta.url);

await import("./write-cli");

for (const target of nativeTargets) {
  const binary = new URL(`dist/bin/${target.platform}/${target.binary}`, packageRoot);

  if (!(await Bun.file(binary).exists())) {
    console.error(`Missing required native binary: dist/bin/${target.platform}/${target.binary}.`);
    process.exit(1);
  }
}
