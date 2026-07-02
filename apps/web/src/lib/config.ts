import type { Config } from './types';

const config: Config = {
  pageTitle: 'Sree N | @eersnington',
  title: 'Sree',
  subtitle: 'software engineer | web, typescript, zig, f1',
  siteUrl: 'https://www.eers.dev',

  links: [
    {
      id: 'github',
      title: 'GitHub',
      url: 'https://github.com/eersnington',
      keybind: 'ggh',
    },
    {
      id: 'twitter',
      title: 'Twitter',
      url: 'https://twitter.com/eersnington',
      keybind: 'gx',
    },
    {
      id: 'linkedin',
      title: 'LinkedIn',
      url: 'https://www.linkedin.com/in/sreenington',
      keybind: 'gli',
    },
    {
      id: 'youtube',
      title: 'YouTube',
      url: 'https://youtube.com/@CrazyDanTHEMinecrafter',
      keybind: 'gyt',
    },
    {
      id: 'email',
      title: 'Contact Me',
      url: 'mailto:hi@eers.dev',
      keybind: 'gcm',
    },
  ],

  keybinds: {
    help: '?', // will be detected with Shift key in the handler
    toggleTheme: 'T', // capital T represents Shift+t
    escape: 'Escape',
  },
};

export default config;
