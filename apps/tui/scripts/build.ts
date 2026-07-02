import { chmod } from "node:fs/promises";
import solidPlugin from "@opentui/solid/bun-plugin";

const nativePackages = [
  "@opentui/core-darwin-x64",
  "@opentui/core-darwin-arm64",
  "@opentui/core-linux-x64",
  "@opentui/core-linux-arm64",
  "@opentui/core-linux-x64-musl",
  "@opentui/core-linux-arm64-musl",
  "@opentui/core-win32-x64",
  "@opentui/core-win32-arm64",
];

const result = await Bun.build({
  entrypoints: ["src/index.tsx"],
  target: "bun",
  external: nativePackages,
  minify: true,
  plugins: [solidPlugin],
  banner: "#!/usr/bin/env bun",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

const [output] = result.outputs;

if (!output) {
  console.error(
    "Build completed without producing an output file for src/index.tsx.",
  );
  process.exit(1);
}

await Bun.write("dist/index.js", output);
await chmod("dist/index.js", 0o755);
