import type { RequestEvent } from "@sveltejs/kit";

const RESUME_URL =
  "https://unruly-double-baf.notion.site/Heyya-this-is-my-resume-3aefba2a3cbf805ca203fa01417de2d5";
const RESUME_READER_URL = `https://r.jina.ai/${RESUME_URL}`;
const RESUME_ORIGIN = new URL(RESUME_URL).origin;

type ResumeFormat = "html" | "markdown";

export async function proxyResume(
  fetch: RequestEvent["fetch"],
  format: ResumeFormat,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(RESUME_READER_URL, {
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

  return new Response(content, {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=300",
      "content-type":
        format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8",
    },
  });
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
