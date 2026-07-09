import { readFile } from "node:fs/promises";

import { nativeTargets } from "./package-targets";

const packageRoot = new URL("..", import.meta.url);
const packageJson = JSON.parse(await readFile(new URL("package.json", packageRoot), "utf8")) as {
  readonly version?: string;
  readonly optionalDependencies?: Record<string, string>;
};

if (!packageJson.version) {
  fail("apps/tui/package.json is missing version.");
}

for (const target of nativeTargets) {
  const actualVersion = packageJson.optionalDependencies?.[target.packageName];

  if (actualVersion !== packageJson.version) {
    fail(
      `apps/tui/package.json optionalDependencies.${target.packageName} must equal version ${packageJson.version}, got ${actualVersion ?? "missing"}.`,
    );
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
