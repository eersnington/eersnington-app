import type { RequestEvent } from "@sveltejs/kit";
import { marked } from "marked";
import fallbackMarkdown from "./resume-fallback.md?raw";

const RESUME_URL =
  "https://unruly-double-baf.notion.site/Heyya-this-is-my-resume-3aefba2a3cbf805ca203fa01417de2d5";
const RESUME_READER_URL = `https://r.jina.ai/${RESUME_URL}`;
const RESUME_CACHE_TTL = 60 * 60 * 24;
const RESUME_FALLBACK_CACHE_TTL = 60 * 5;
const RESUME_CONTENT_MARKER = "Sreenarayanan Sreekanth";
const RESUME_CACHE_VERSION = "v3";

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
  const forceRefresh = event.url.searchParams.get("refresh") === "1";
  const cachePath = format === "html" ? "/resume" : "/resume.md";
  const cacheKey = new URL(
    `${cachePath}?resume-cache=${RESUME_CACHE_VERSION}`,
    event.url,
  ).toString();

  if (cache && !forceRefresh) {
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
      headers: {
        "x-respond-with": "markdown",
        ...(forceRefresh ? { "x-no-cache": "true" } : {}),
      },
    });

    if (response.ok) {
      const upstreamContent = await response.text();
      if (upstreamContent.includes(RESUME_CONTENT_MARKER)) {
        const markdown = cleanReaderMarkdown(upstreamContent);
        content = format === "html" ? renderHtml(markdown) : markdown;
        source = "upstream";
      }
    }
  } catch {
    // Serve the checked-in snapshot when the reader is unavailable.
  }

  if (!content) {
    content = format === "html" ? renderHtml(fallbackMarkdown) : fallbackMarkdown;
  }

  const cacheTtl = source === "upstream" ? RESUME_CACHE_TTL : RESUME_FALLBACK_CACHE_TTL;
  const shouldCache = cache && (source === "upstream" || !forceRefresh);

  const result = new Response(content, {
    headers: {
      "cache-control":
        forceRefresh && source === "fallback"
          ? "no-store"
          : `public, max-age=${cacheTtl}, stale-if-error=${RESUME_CACHE_TTL}`,
      "content-type":
        format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8",
      "x-resume-source": source,
    },
  });

  if (shouldCache) {
    try {
      await cache.put(cacheKey, result.clone());
    } catch {
      // The response is still valid when caching fails.
    }
  }

  return result;
}

function cleanReaderMarkdown(content: string): string {
  const marker = "Markdown Content:";
  const markerIndex = content.indexOf(marker);
  const markdown = markerIndex === -1 ? content : content.slice(markerIndex + marker.length);

  return markdown
    .replace(/^\s*\[Skip to content\]\([^\n]+\)\s*/i, "")
    .replace(/!\[[^\]]*\]\(blob:http:\/\/localhost\/[^)]+\)/g, "")
    .trimStart();
}

function renderHtml(markdown: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Heyya, this is my resume</title>
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; background: #191919; color: #f5f5f5; font: 16px/1.6 system-ui, sans-serif; }
      main { max-width: 860px; margin: 0 auto; padding: 32px 24px 64px; }
      a { color: #9ecbff; }
      h1, h2, h3, h4 { line-height: 1.25; }
      img { max-width: 100%; }
    </style>
  </head>
  <body><main>${marked.parse(markdown, { async: false })}</main></body>
</html>`;
}
