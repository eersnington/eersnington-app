import type { RequestEvent } from "@sveltejs/kit";
import { marked } from "marked";
import fallbackMarkdown from "./resume-fallback.md?raw";

const RESUME_URL =
  "https://unruly-double-baf.notion.site/Heyya-this-is-my-resume-3aefba2a3cbf805ca203fa01417de2d5";
const RESUME_READER_URL = `https://r.jina.ai/${RESUME_URL}`;
const RESUME_CACHE_TTL = 60 * 60 * 24;
const RESUME_FALLBACK_CACHE_TTL = 60 * 5;
const RESUME_CONTENT_MARKER = "Sreenarayanan Sreekanth";
const RESUME_CACHE_VERSION = "v4";

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
  const markdown = (markerIndex === -1 ? content : content.slice(markerIndex + marker.length))
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  const headingIndex = markdown.search(/^# /m);
  const resume = headingIndex === -1 ? markdown : markdown.slice(headingIndex);

  const cleaned = resume
    .replace(/^(# .+?)\s*$/m, "$1 🫳")
    .replace(
      /\n+S\n+Sree Narayanan\n+([^\n]+)\n+([^\n]+)\n+(### Sreenarayanan Sreekanth)/,
      "\n\n> **Sree Narayanan** · $1\n>\n> $2\n\n---\n\n$3",
    )
    .replace(
      /\n{2,}([A-Za-z_$][\w$]*(?:\.[\w$]+)*(?:\([^\n]*\))?(?:\.[\w$]+\([^\n]*\))*)\n{2,}/g,
      " `$1` ",
    )
    .replace(/^([^\n]+?) — (\[[^\n]+\]\([^)]+\))\s*$/gm, "#### $1 — $2")
    .replace(/(\]\([^)]+\))(?=[A-Za-z])/g, "$1 ")
    .trimStart();

  return `🧹\n\n${cleaned}`;
}

function renderHtml(markdown: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Heyya, this is my resume</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: #191919;
        color: rgba(255, 255, 255, 0.9);
        font: 17px/1.55 ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      main { width: min(100%, 1100px); margin: 0 auto; padding: 112px 80px 120px; }
      main > p:first-child { margin: 0 0 72px; font-size: 64px; line-height: 1; }
      h1, h2, h3, h4 { color: rgba(255, 255, 255, 0.95); line-height: 1.2; }
      h1 { margin: 0 0 84px; font-size: 44px; letter-spacing: -0.035em; }
      h3 { margin: 68px 0 24px; font-size: 27px; letter-spacing: -0.025em; }
      h1 + h3 { margin-top: 0; font-size: 25px; }
      h4 { position: relative; margin: 34px 0 18px; padding-left: 28px; font-size: 19px; font-weight: 700; }
      h4::before { position: absolute; left: 4px; content: "•"; }
      h4 a { font-weight: 400; }
      p { margin: 0 0 18px; }
      strong { color: rgba(255, 255, 255, 0.95); font-weight: 700; }
      code {
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        color: rgb(255, 94, 94);
        font: 0.88em/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }
      a { color: rgb(255, 94, 31); text-decoration-color: rgba(255, 94, 31, 0.65); text-underline-offset: 2px; }
      a:hover { color: rgb(255, 125, 75); }
      hr { height: 1px; margin: 34px 0 0; border: 0; background: rgba(255, 255, 255, 0.13); }
      blockquote {
        position: relative;
        margin: -32px 0 0;
        padding: 0 0 28px 64px;
        border: 0;
      }
      blockquote::before {
        position: absolute;
        top: -2px;
        left: 0;
        display: grid;
        width: 42px;
        height: 42px;
        place-items: center;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 50%;
        background: #252525;
        color: rgba(255, 255, 255, 0.65);
        content: "S";
      }
      blockquote p { margin-bottom: 10px; }
      blockquote p:first-child { color: rgba(255, 255, 255, 0.45); }
      blockquote p:first-child strong { margin-right: 6px; }
      blockquote + hr { margin-top: 0; }
      img { max-width: 100%; }
      @media (max-width: 700px) {
        body { font-size: 16px; }
        main { padding: 56px 24px 80px; }
        main > p:first-child { margin-bottom: 48px; font-size: 48px; }
        h1 { margin-bottom: 56px; font-size: 36px; }
        blockquote { margin-top: -16px; padding-left: 54px; }
        blockquote::before { width: 38px; height: 38px; }
        h3 { margin-top: 52px; font-size: 24px; }
        h1 + h3 { font-size: 22px; }
        h4 { font-size: 18px; }
      }
    </style>
  </head>
  <body><main>${marked.parse(markdown, { async: false })}</main></body>
</html>`;
}
