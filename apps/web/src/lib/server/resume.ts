import type { RequestEvent } from "@sveltejs/kit";

const RESUME_URL =
  "https://unruly-double-baf.notion.site/Heyya-this-is-my-resume-3aefba2a3cbf805ca203fa01417de2d5";
const RESUME_READER_URL = `https://r.jina.ai/${RESUME_URL}`;
const RESUME_ORIGIN = new URL(RESUME_URL).origin;
const RESUME_CACHE_TTL = 60 * 60 * 24;

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
  const cacheKey = new URL(format === "html" ? "/resume" : "/resume.md", event.url).toString();

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

  let response: Response;
  try {
    response = await event.fetch(RESUME_READER_URL, {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown network error";
    return upstreamError(`Could not load the resume. The upstream request failed: ${message}`);
  }

  if (!response.ok) {
    return upstreamError(
      `Could not load the resume. The upstream service returned ${response.status}. The original resume is still available at ${RESUME_URL}`,
    );
  }

  const body = await response.text();
  const content = format === "html" ? addNotionBaseUrl(body) : body;

  const result = new Response(content, {
    headers: {
      "cache-control": `public, max-age=${RESUME_CACHE_TTL}, stale-if-error=${RESUME_CACHE_TTL}`,
      "content-type":
        format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8",
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

function addNotionBaseUrl(html: string): string {
  return html.replace(/<head(\s[^>]*)?>/i, (head) => `${head}<base href="${RESUME_ORIGIN}/">`);
}

function upstreamError(message: string): Response {
  return new Response(message, {
    status: 502,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
