<script lang="ts">
import type { Theme } from '$lib/themes';

const {
  themes,
  currentThemeIndex,
  onSelectTheme,
  onClose,
  theme,
}: {
  themes: Theme[];
  currentThemeIndex: number;
  onSelectTheme: (index: number) => void;
  onClose: () => void;
  theme: {
    background: string;
    foreground: string;
    selection: string;
    accent: string;
  };
} = $props();

let focusedIndex = $state(0);

$effect(() => {
  focusedIndex = currentThemeIndex;
});

function handleKeyNavigation(key: string): boolean {
  if (key === 'ArrowDown' || key === 'j') {
    focusedIndex = Math.min(focusedIndex + 1, themes.length - 1);
    return true;
  }
  if (key === 'ArrowUp' || key === 'k') {
    focusedIndex = Math.max(focusedIndex - 1, 0);
    return true;
  }
  return false;
}

function handleKeyAction(key: string): boolean {
  if (key === 'Escape') {
    onClose();
    return true;
  }
  if (key === 'Enter') {
    onSelectTheme(focusedIndex);
    return true;
  }
  return false;
}

function shouldPreventDefault(key: string): boolean {
  return ['ArrowDown', 'ArrowUp', 'j', 'k', 'Enter', 'Escape'].includes(key);
}

$effect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (shouldPreventDefault(e.key)) {
      e.preventDefault();
    }

    if (handleKeyAction(e.key)) {
      return;
    }
    handleKeyNavigation(e.key);
  };

  window.addEventListener('keydown', handleKeyDown, { capture: true });
  return () =>
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
});
</script>

<div
	aria-labelledby="theme-title"
	aria-modal="true"
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
	role="dialog"
>
	<div
		class="w-full max-w-md rounded-md p-6 shadow-lg"
		style="background-color: {theme.background}; color: {theme.foreground}; border: 1px solid {theme.accent};"
	>
		<h2
			class="mb-4 pb-2 font-bold text-xl"
			id="theme-title"
			style="border-bottom: 1px solid {theme.selection};"
		>
			Theme Selector
		</h2>

		<div class="grid gap-4">
			{#each themes as t, index}
				<button
					class="flex items-center justify-between rounded-md p-3 transition-colors"
					onclick={() => onSelectTheme(index)}
					onmouseenter={() => focusedIndex = index}
					style="background-color: {index === focusedIndex ? theme.selection : 'transparent'}; border-left: 2px solid {index === currentThemeIndex ? theme.accent : 'transparent'}; outline: none;"
					type="button"
				>
					<span class="font-medium">
						{#if index === currentThemeIndex}✓ {/if}
						{t.name}
					</span>
					<div class="flex gap-2">
						<div
							class="h-4 w-4 rounded-full border border-gray-600"
							style="background-color: {t.colors.background};"
						></div>
						<div
							class="h-4 w-4 rounded-full border border-gray-600"
							style="background-color: {t.colors.accent};"
						></div>
						<div
							class="h-4 w-4 rounded-full border border-gray-600"
							style="background-color: {t.colors.foreground};"
						></div>
					</div>
				</button>
			{/each}
		</div>

		<div class="mt-6 flex gap-2">
			<button
				class="flex-1 rounded-md py-2 font-bold"
				onclick={onClose}
				style="background-color: {theme.accent}; color: {theme.background};"
				type="button"
			>
				Close
			</button>
			<div
				class="flex items-center rounded-md px-3 py-2 text-xs opacity-70"
				style="background-color: {theme.selection};"
			>
				Use ↑↓ and Enter to select
			</div>
		</div>
	</div>
</div>
