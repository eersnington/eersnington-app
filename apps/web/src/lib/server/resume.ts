import type { RequestEvent } from "@sveltejs/kit";
import fallbackMarkdown from "./resume-fallback.md?raw";

const RESUME_URL =
  "https://unruly-double-baf.notion.site/Heyya-this-is-my-resume-3aefba2a3cbf805ca203fa01417de2d5";
const RESUME_READER_URL = `https://r.jina.ai/${RESUME_URL}`;
const RESUME_ORIGIN = new URL(RESUME_URL).origin;
const RESUME_CACHE_TTL = 60 * 60 * 24;
const RESUME_FALLBACK_CACHE_TTL = 60 * 5;
const RESUME_CONTENT_MARKER = "Sreenarayanan Sreekanth";
const RESUME_CACHE_VERSION = "v2";

type ResumeFormat = "html" | "markdown";

interface ResumeCache {
  match(request: string): Promise<Response | undefined>;
  put(request: string, response: Response): Promise<void>;
}

export async function proxyResume(
  event: Pick<RequestEvent, "fetch" | "platform" | "url">,
  format: ResumeFormat,
): Promise<Response> {
  const cache = event.platform?.caches.default as unknown as ResumeCache | undefined;
  const cachePath = format === "html" ? "/resume" : "/resume.md";
  const cacheKey = new URL(
    `${cachePath}?resume-cache=${RESUME_CACHE_VERSION}`,
    event.url,
  ).toString();

  if (cache) {
    try {
      const cached = await cache.match(cacheKey);
      if (cached) {
        return cached;
      }
    } catch {
      // Continue to the upstream when the edge cache is unavailable.
    }
  }

  let content: string | undefined;
  let source: "upstream" | "fallback" = "fallback";

  try {
    const response = await event.fetch(RESUME_READER_URL, {
      headers:
        format === "html"
          ? {
              "x-respond-timing": "resource-idle",
              "x-respond-with": "html",
            }
          : {
              "x-respond-with": "markdown",
            },
    });

    if (response.ok) {
      const upstreamContent = await response.text();
      if (upstreamContent.includes(RESUME_CONTENT_MARKER)) {
        content = format === "html" ? prepareHtml(upstreamContent) : upstreamContent;
        source = "upstream";
      }
    }
  } catch {
    // Serve the checked-in snapshot when the reader is unavailable.
  }

  if (!content) {
    content = format === "html" ? fallbackHtml() : fallbackMarkdown;
  }

  const cacheTtl = source === "upstream" ? RESUME_CACHE_TTL : RESUME_FALLBACK_CACHE_TTL;

  const result = new Response(content, {
    headers: {
      "cache-control": `public, max-age=${cacheTtl}, stale-if-error=${RESUME_CACHE_TTL}`,
      "content-type":
        format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8",
      "x-resume-source": source,
    },
  });

  if (cache) {
    try {
      await cache.put(cacheKey, result.clone());
    } catch {
      // The response is still valid when caching fails.
    }
  }

  return result;
}

function prepareHtml(html: string): string {
  const withoutScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  return withoutScripts.replace(
    /<head(\s[^>]*)?>/i,
    (head) => `${head}<base href="${RESUME_ORIGIN}/">`,
  );
}

function fallbackHtml(): string {
  const escapedMarkdown = fallbackMarkdown.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Heyya, this is my resume</title>
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; background: #191919; color: #f5f5f5; font: 16px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; }
      main { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; }
    </style>
  </head>
  <body><main><pre>${escapedMarkdown}</pre></main></body>
</html>`;
}
