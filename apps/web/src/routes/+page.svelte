<script lang="ts">
import { onMount } from 'svelte';
import AsciiTitle from '$lib/components/AsciiTitle.svelte';
import BackgroundTildes from '$lib/components/BackgroundTildes.svelte';
import KeybindHelp from '$lib/components/KeybindHelp.svelte';
import LineNumbers from '$lib/components/LineNumbers.svelte';
import NavigationLinks from '$lib/components/NavigationLinks.svelte';
import StatusLine from '$lib/components/StatusLine.svelte';
import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
import VimStatusDisplay from '$lib/components/VimStatusDisplay.svelte';
import config from '$lib/config';
import { DEFAULTS, KEYBOARD, LAYOUT } from '$lib/constants';
import { defaultTheme, themes } from '$lib/themes';
import type { Link } from '$lib/types';
import {
  isDownKey,
  isEnterKey,
  isEscapeKey,
  isHelpKeybind,
  isInputTarget,
  isThemeToggleKeybind,
  isUpKey,
  preventNavigationDefaults,
  toVimKey,
} from '$lib/utils/keyboard-utils';

const DEFAULT_WINDOW_HEIGHT = 800;

let currentThemeIndex = $state(0);
const currentTheme = $derived(themes[currentThemeIndex] ?? defaultTheme);

let showHelp = $state(false);
let showThemeSwitcher = $state(false);
const isAnyModalOpen = $derived(showHelp || showThemeSwitcher);

let selectedIndex = $state(0);
let keysPressed = $state<string[]>([]);
let keyBuffer = $state('');
let keyBufferTimeout: ReturnType<typeof setTimeout> | null = null;

let windowHeight = $state(DEFAULT_WINDOW_HEIGHT);

function setTheme(index: number) {
  if (index >= 0 && index < themes.length) {
    currentThemeIndex = index;
  }
}

function toggleHelp() {
  showHelp = !showHelp;
  showThemeSwitcher = false;
}

function toggleThemeSwitcher() {
  showThemeSwitcher = !showThemeSwitcher;
  showHelp = false;
}

function closeModals() {
  showHelp = false;
  showThemeSwitcher = false;
}

function handleLinkActivate(link: Link) {
  const newWindow = window.open(link.url, '_blank', 'noopener,noreferrer');
  if (newWindow) {
    newWindow.opener = null;
  }
}

function setSelectedIndex(index: number) {
  selectedIndex = index;
}

function clearKeyBuffer() {
  keyBuffer = '';
  if (keyBufferTimeout) {
    clearTimeout(keyBufferTimeout);
    keyBufferTimeout = null;
  }
}

function resetKeyboardState() {
  keysPressed = [];
  clearKeyBuffer();
}

function addKeyToBuffer(key: string) {
  const vimKey = toVimKey(key);

  if (keyBuffer.length > KEYBOARD.MAX_BUFFER_LENGTH) {
    keyBuffer = vimKey;
  } else {
    keyBuffer = keyBuffer + vimKey;
  }

  if (keyBufferTimeout) {
    clearTimeout(keyBufferTimeout);
  }

  keyBufferTimeout = setTimeout(() => {
    keyBuffer = '';
  }, KEYBOARD.KEY_BUFFER_TIMEOUT);
}

function addKeyPressed(key: string) {
  const newKeys = [...keysPressed, key];
  if (newKeys.length > KEYBOARD.MAX_KEYS_PRESSED) {
    keysPressed = newKeys.slice(newKeys.length - KEYBOARD.MAX_KEYS_PRESSED);
  } else {
    keysPressed = newKeys;
  }
}

function handleNavigation(key: string) {
  if (isDownKey(key)) {
    selectedIndex = Math.min(selectedIndex + 1, config.links.length - 1);
  } else if (isUpKey(key)) {
    selectedIndex = Math.max(selectedIndex - 1, 0);
  }
}

function handleLinkActivation(key: string) {
  if (isEnterKey(key)) {
    const selectedLink = config.links[selectedIndex];
    if (selectedLink) {
      handleLinkActivate(selectedLink);
    }
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (isAnyModalOpen || isInputTarget(event.target)) {
    return;
  }

  preventNavigationDefaults(event);

  const { key } = event;

  if (isHelpKeybind(event)) {
    event.preventDefault();
    toggleHelp();
    return;
  }

  if (isThemeToggleKeybind(event)) {
    event.preventDefault();
    toggleThemeSwitcher();
    return;
  }

  if (isEscapeKey(key)) {
    event.preventDefault();
    resetKeyboardState();
    return;
  }

  addKeyPressed(key);
  addKeyToBuffer(key);
  handleNavigation(key);
  handleLinkActivation(key);
}

$effect(() => {
  if (isAnyModalOpen) {
    return;
  }

  const keysString = keysPressed.join('');

  for (const link of config.links) {
    if (keysString.endsWith(link.keybind)) {
      handleLinkActivate(link);
      resetKeyboardState();
      break;
    }
  }
});

onMount(() => {
  windowHeight = window.innerHeight;

  const handleResize = () => {
    windowHeight = window.innerHeight;
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);
    if (keyBufferTimeout) {
      clearTimeout(keyBufferTimeout);
    }
  };
});

const theme = $derived(currentTheme.colors);
const lineCount = $derived(
  Math.max(
    0,
    Math.floor((windowHeight - LAYOUT.STATUS_LINE_HEIGHT) / LAYOUT.LINE_HEIGHT)
  )
);
</script>



<div
	class="relative flex min-h-screen flex-col font-mono text-sm"
	style="background-color: {theme.background}; color: {theme.foreground};"
>
	<LineNumbers
		color={theme.lineNumbers}
		count={lineCount}
		currentLine={DEFAULTS.LINE}
	/>

	<main
		class="relative p-4 pl-12"
		style="height: calc(100vh - {LAYOUT.STATUS_LINE_HEIGHT}px);"
	>
		<div class="flex min-h-[80vh] flex-col items-center justify-center gap-6">
			<AsciiTitle color={theme.accent} />

			<div
				class="mb-8 px-4 py-2 text-center text-lg"
				style="background-color: {theme.selection}; color: {theme.foreground};"
			>
				{config.subtitle} <span class="animate-pulse text-xl">▲</span>
			</div>

			<NavigationLinks
				links={config.links}
				{selectedIndex}
				{theme}
				onLinkActivate={handleLinkActivate}
				onSelectIndex={setSelectedIndex}
			/>

			<VimStatusDisplay keyBuffer={keyBuffer} mode={DEFAULTS.MODE} />
		</div>

		<BackgroundTildes color={theme.lineNumbers} />
	</main>

	<StatusLine
		currentTheme={currentTheme.name}
		file={DEFAULTS.FILE}
		filetype={DEFAULTS.FILETYPE}
		helpText="Press Shift + ? for help | Shift + T for themes"
		mode={DEFAULTS.MODE}
		position={{ line: DEFAULTS.LINE, col: DEFAULTS.COLUMN }}
		{theme}
	/>

	{#if showHelp}
		<KeybindHelp
			links={config.links}
			keybinds={config.keybinds}
			onClose={closeModals}
			{theme}
		/>
	{/if}

	{#if showThemeSwitcher}
		<ThemeSwitcher
			{currentThemeIndex}
			onClose={closeModals}
			onSelectTheme={setTheme}
			{theme}
			{themes}
		/>
	{/if}
</div>
