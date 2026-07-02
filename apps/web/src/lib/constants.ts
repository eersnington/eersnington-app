/**
 * App wide constants for the Neovim style portfolio
 */

export const KEYBOARD = {
  MAX_KEYS_PRESSED: 5,
  KEY_BUFFER_TIMEOUT: 1500,
  MAX_BUFFER_LENGTH: 10,
} as const;

export const LAYOUT = {
  LINE_COUNT: 50,
  LINE_HEIGHT: 24, // 6 * 4 = 24px (h-6 in Tailwind)
  STATUS_LINE_HEIGHT: 32, // 8 * 4 = 32px (h-8 in Tailwind)
} as const;

export const DEFAULTS = {
  MODE: 'NORMAL',
  FILE: '~/index.html',
  FILETYPE: 'html',
  LINE: 1,
  COLUMN: 1,
} as const;

export const KEYBIND_PATTERNS = {
  ARROW_KEYS: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
  VIM_NAVIGATION: ['j', 'k', 'h', 'l'],
  NAVIGATION_KEYS: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '],
  MODAL_KEYS: ['ArrowDown', 'ArrowUp', 'j', 'k', 'Enter', 'Escape'],
} as const;
