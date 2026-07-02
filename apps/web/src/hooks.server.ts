import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = ({ event, resolve }) => {
  if (event.url.pathname === '/skill') {
    redirect(308, '/SKILL');
  }

  if (event.url.pathname === '/skill.md') {
    redirect(308, '/SKILL.md');
  }

  return resolve(event);
};
