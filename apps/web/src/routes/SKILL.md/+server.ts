const SKILL_RAW_URL =
  'https://gist.githubusercontent.com/eersnington/4154c43469dba9aeb46e2632c86ec911/raw/SKILL.md';

export async function GET({ fetch }) {
  const response = await fetch(SKILL_RAW_URL);

  if (!response.ok) {
    return new Response(
      `Could not load the latest SKILL.md from GitHub Gist. GitHub returned ${response.status}. The original gist is still available at ${SKILL_RAW_URL}`,
      {
        status: 502,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    );
  }

  return new Response(await response.text(), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}
