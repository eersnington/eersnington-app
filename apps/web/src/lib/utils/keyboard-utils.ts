/**
 * Keyboard event handling utilities
 */

import { KEYBIND_PATTERNS } from '../constants';
import type { KeyboardEvent } from '../types';

/**
 * Check if the pressed key is a navigation key
 * @param key - The key that was pressed
 * @returns true if it's a navigation key
 */
export const isNavigationKey = (key: string): boolean => {
  return [
    ...KEYBIND_PATTERNS.ARROW_KEYS,
    ...KEYBIND_PATTERNS.VIM_NAVIGATION,
    ' ',
  ].includes(key);
};

/**
 * Check if the pressed key is a modal control key
 * @param key - The key that was pressed
 * @returns true if it's a modal control key
 */
export const isModalKey = (key: string): boolean => {
  return (KEYBIND_PATTERNS.MODAL_KEYS as readonly string[]).includes(key);
};

/**
 * Convert arrow keys to vim-style notation
 * @param key - The key to convert
 * @returns vim-style key notation
 */
export const toVimKey = (key: string): string => {
  const keyMap = {
    ArrowUp: 'k',
    ArrowDown: 'j',
    ArrowLeft: 'h',
    ArrowRight: 'l',
  } as const;

  return keyMap[key as keyof typeof keyMap] ?? key;
};

/**
 * Check if event target is an input field
 * @param target - The event target
 * @returns true if target is input or textarea
 */
export const isInputTarget = (target: EventTarget | null): boolean => {
  return (
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
  );
};

/**
 * Check if key combination matches help keybind (Shift + ?)
 * @param event - The keyboard event
 * @returns true if it's the help keybind
 */
export const isHelpKeybind = (event: KeyboardEvent): boolean => {
  return event.key === '?' && event.shiftKey;
};

/**
 * Check if key combination matches theme toggle keybind (Shift + T)
 * @param event - The keyboard event
 * @returns true if it's the theme toggle keybind
 */
export const isThemeToggleKeybind = (event: KeyboardEvent): boolean => {
  return event.shiftKey && (event.key === 'T' || event.key === 't');
};

/**
 * Check if the key is the escape key
 * @param key - The key to check
 * @returns true if it's the escape key
 */
export const isEscapeKey = (key: string): boolean => {
  return key === 'Escape';
};

/**
 * Check if the key is an up navigation key (k or ArrowUp)
 * @param key - The key to check
 * @returns true if it's an up navigation key
 */
export const isUpKey = (key: string): boolean => {
  return key === 'k' || key === 'ArrowUp';
};

/**
 * Check if the key is a down navigation key (j or ArrowDown)
 * @param key - The key to check
 * @returns true if it's a down navigation key
 */
export const isDownKey = (key: string): boolean => {
  return key === 'j' || key === 'ArrowDown';
};

/**
 * Check if the key is the enter key
 * @param key - The key to check
 * @returns true if it's the enter key
 */
export const isEnterKey = (key: string): boolean => {
  return key === 'Enter';
};

/**
 * Prevent default behavior for navigation keys
 * @param event - The keyboard event
 */
export const preventNavigationDefaults = (event: KeyboardEvent): void => {
  if (isNavigationKey(event.key)) {
    event.preventDefault();
  }
};
