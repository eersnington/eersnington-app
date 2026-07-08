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
  { platform: "win32-arm64", binary: "eersnington.exe", executable: false },
  { platform: "win32-x64", binary: "eersnington.exe", executable: false },
] as const satisfies readonly NativeTarget[];

export function currentTarget(): NativeTarget {
  const platform = `${process.platform}-${process.arch}`;
  const binary = process.platform === "win32" ? "eersnington.exe" : "eersnington";

  return {
    platform,
    binary,
    executable: process.platform !== "win32",
  };
}
