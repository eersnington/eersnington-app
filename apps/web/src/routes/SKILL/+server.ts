import { redirect } from '@sveltejs/kit';

const SKILL_GIST_URL =
  'https://gist.github.com/eersnington/4154c43469dba9aeb46e2632c86ec911';

export function GET() {
  redirect(301, SKILL_GIST_URL);
}
