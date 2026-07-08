export type NativeTarget = {
  readonly platform: string;
  readonly packageName: string;
  readonly binary: string;
  readonly executable: boolean;
  readonly os: readonly string[];
  readonly cpu: readonly string[];
  readonly libc?: readonly string[];
};

export const nativeTargets: readonly NativeTarget[] = [
  {
    platform: "darwin-arm64",
    packageName: "@eersnington/tui-darwin-arm64",
    binary: "eersnington",
    executable: true,
    os: ["darwin"],
    cpu: ["arm64"],
  },
  {
    platform: "darwin-x64",
    packageName: "@eersnington/tui-darwin-x64",
    binary: "eersnington",
    executable: true,
    os: ["darwin"],
    cpu: ["x64"],
  },
  {
    platform: "linux-arm64",
    packageName: "@eersnington/tui-linux-arm64-gnu",
    binary: "eersnington",
    executable: true,
    os: ["linux"],
    cpu: ["arm64"],
    libc: ["glibc"],
  },
  {
    platform: "linux-x64",
    packageName: "@eersnington/tui-linux-x64-gnu",
    binary: "eersnington",
    executable: true,
    os: ["linux"],
    cpu: ["x64"],
    libc: ["glibc"],
  },
  {
    platform: "linux-arm64-musl",
    packageName: "@eersnington/tui-linux-arm64-musl",
    binary: "eersnington",
    executable: true,
    os: ["linux"],
    cpu: ["arm64"],
    libc: ["musl"],
  },
  {
    platform: "linux-x64-musl",
    packageName: "@eersnington/tui-linux-x64-musl",
    binary: "eersnington",
    executable: true,
    os: ["linux"],
    cpu: ["x64"],
    libc: ["musl"],
  },
] as const;

export function nativePackageDependencies(version: string): Record<string, string> {
  return Object.fromEntries(nativeTargets.map((target) => [target.packageName, version]));
}

export function currentTarget(): NativeTarget {
  const platform = `${process.platform}-${process.arch}${isMuslLinux() ? "-musl" : ""}`;
  const target = nativeTargets.find((nativeTarget) => nativeTarget.platform === platform);

  if (!target) {
    throw new Error(
      `Unsupported native target: ${platform}. Build on one of: ${nativeTargets.map((nativeTarget) => nativeTarget.platform).join(", ")}.`,
    );
  }

  return target;
}

function isMuslLinux(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  const report = process.report?.getReport() as
    | { readonly header?: { readonly glibcVersionRuntime?: string } }
    | undefined;

  return !report?.header?.glibcVersionRuntime;
}
