import { proxyResume } from "$lib/server/resume";

export function GET({ fetch }) {
  return proxyResume(fetch, "markdown");
}
