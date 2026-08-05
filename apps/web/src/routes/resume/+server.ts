import { redirect } from "@sveltejs/kit";

const RESUME_URL =
  "https://unruly-double-baf.notion.site/Eeersnington-Resume-3aefba2a3cbf805ca203fa01417de2d5?pvs=74";

export function GET() {
  redirect(302, RESUME_URL);
}
