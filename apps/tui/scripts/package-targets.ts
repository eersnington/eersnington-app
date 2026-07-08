export type NativeTarget = {
  readonly platform: string;
  readonly binary: string;
  readonly executable: boolean;
};

export const nativeTargets = [
  { platform: "darwin-arm64", binary: "eersnington", executable: true },
  { platform: "darwin-x64", binary: "eersnington", executable: true },
  { platform: "linux-arm64", binary: "eersnington", executable: true },
  { platform: "linux-x64", binary: "eersnington", executable: true },
  { platform: "linux-arm64-musl", binary: "eersnington", executable: true },
  { platform: "linux-x64-musl", binary: "eersnington", executable: true },
] as const satisfies readonly NativeTarget[];

export function currentTarget(): NativeTarget {
  const platform = `${process.platform}-${process.arch}${isMuslLinux() ? "-musl" : ""}`;
  const binary = process.platform === "win32" ? "eersnington.exe" : "eersnington";

  return {
    platform,
    binary,
    executable: process.platform !== "win32",
  };
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
