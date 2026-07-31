import { proxyResume } from "$lib/server/resume";

export function GET(event) {
  return proxyResume(event, "markdown");
}
