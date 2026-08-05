import type { RequestEvent } from "@sveltejs/kit";
import fallbackMarkdown from "./resume-fallback.md?raw";

const RESUME_URL =
  "https://unruly-double-baf.notion.site/Eeersnington-Resume-3aefba2a3cbf805ca203fa01417de2d5?pvs=74";
const RESUME_READER_URL = `https://r.jina.ai/${RESUME_URL}`;

export async function proxyResumeMarkdown(event: RequestEvent): Promise<Response> {
  try {
    const response = await event.fetch(RESUME_READER_URL, {
      headers: { "x-respond-with": "markdown" },
    });
    if (response.ok) {
      return new Response(await response.text(), {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      });
    }
  } catch {
    // The checked-in snapshot keeps the Markdown endpoint available.
  }

  return new Response(fallbackMarkdown, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
