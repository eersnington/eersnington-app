/**
 * Comprehensive TypeScript definitions for the Neovim-style portfolio
 */

import type { Theme } from './themes';

export type Link = {
  id: string;
  title: string;
  url: string;
  keybind: string;
  icon?: string;
};

export type Config = {
	pageTitle: string;
	// Homepage title and subtitle
	title: string;
	subtitle: string;

	// Site URL for canonical links and SEO
	siteUrl: string;

	// Navigation links
	links: Link[];

	// Keyboard shortcuts
	keybinds: {
		help: string;
		toggleTheme: string;
		escape: string;
	};
};

export type Position = {
  readonly line: number;
  readonly col: number;
};

export type KeyboardState = {
  readonly keysPressed: readonly string[];
  readonly keyBuffer: string;
};

export type ModalState = {
  readonly showHelp: boolean;
  readonly showThemeSwitcher: boolean;
};

export type NavigationState = {
  readonly selectedIndex: number;
  readonly currentMode: string;
  readonly currentFile: string;
  readonly currentLine: number;
  readonly currentCol: number;
};

export type ThemeState = {
  readonly currentTheme: Theme;
  readonly currentThemeIndex: number;
};

export type KeyboardEvent = globalThis.KeyboardEvent;

export type KeyboardHandler = (event: KeyboardEvent) => void;

export type LinkIconProps = {
  readonly id: string;
  readonly className?: string;
};

export type LinkItemProps = {
  readonly link: Link;
  readonly index: number;
  readonly isSelected: boolean;
  readonly theme: Theme['colors'];
  readonly onMouseEnter: () => void;
  readonly onClick: () => void;
};

export type NavigationLinksProps = {
  readonly links: readonly Link[];
  readonly selectedIndex: number;
  readonly theme: Theme['colors'];
  readonly onLinkActivate: (link: Link) => void;
  readonly onSelectIndex?: (index: number) => void; // optional callback to sync selection from mouse hover
};

export type VimStatusDisplayProps = {
  readonly mode: string;
  readonly keyBuffer: string;
};

export type BackgroundTildesProps = {
  readonly lineCount: number;
  readonly color: string;
};

export type ModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly theme: Theme['colors'];
  readonly children: import('svelte').Snippet;
};

export type UseKeyboardNavigationProps = {
  readonly links: readonly Link[];
  readonly onLinkActivate: (link: Link) => void;
  readonly onToggleHelp: () => void;
  readonly onToggleTheme: () => void;
  readonly isModalOpen: boolean;
};

export type UseKeyboardNavigationReturn = {
  readonly selectedIndex: number;
  readonly keyBuffer: string;
  readonly keysPressed: readonly string[];
  readonly setSelectedIndex: (index: number) => void;
};

export type UseThemeManagerProps = {
  readonly themes?: readonly Theme[];
  readonly defaultThemeIndex?: number;
};

export type UseThemeManagerReturn = {
  readonly currentTheme: Theme;
  readonly currentThemeIndex: number;
  readonly setTheme: (index: number) => void;
};

export type UseModalStateReturn = {
  readonly showHelp: boolean;
  readonly showThemeSwitcher: boolean;
  readonly toggleHelp: () => void;
  readonly toggleThemeSwitcher: () => void;
  readonly closeModals: () => void;
  readonly isAnyModalOpen: boolean;
};

export type HomePageProps = {
  readonly className?: string;
};

export type IconComponent = import('svelte').Component | null;

export type KeybindPattern = readonly string[];

export type LinkActivateHandler = (link: Link) => void;

export type ThemeChangeHandler = (index: number) => void;

export type ModalToggleHandler = () => void;

export type KeyPressHandler = (key: string) => void;
