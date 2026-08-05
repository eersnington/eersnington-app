import { proxyResumeMarkdown } from "$lib/server/resume";

export function GET(event) {
  return proxyResumeMarkdown(event);
}
