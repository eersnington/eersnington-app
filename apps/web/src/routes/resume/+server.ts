import { redirect } from '@sveltejs/kit';

export function GET() {
  redirect(
    301,
    'https://docs.google.com/document/d/1bvGh-TQAG5QHST-xRfmfY9YIwPha3xrETrSPUgb-11M/edit?usp=sharing'
  );
}