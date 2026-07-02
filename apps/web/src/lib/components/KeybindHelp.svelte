<script lang="ts">
import Github from 'lucide-svelte/icons/github';
import Linkedin from 'lucide-svelte/icons/linkedin';
import Mail from 'lucide-svelte/icons/mail';
import Twitter from 'lucide-svelte/icons/twitter';
import Youtube from 'lucide-svelte/icons/youtube';
import type { Link } from '$lib/types';

const {
  links,
  keybinds,
  onClose,
  theme,
}: {
  links: Link[];
  keybinds: {
    help: string;
    toggleTheme: string;
    escape: string;
  };
  onClose: () => void;
  theme: {
    background: string;
    foreground: string;
    selection: string;
    accent: string;
  };
} = $props();

const iconMap: Record<string, typeof Github> = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  email: Mail,
};

$effect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  window.addEventListener('keydown', handleKeyDown, { capture: true });
  return () =>
    window.removeEventListener('keydown', handleKeyDown, { capture: true });
});
</script>

<div
	aria-labelledby="help-title"
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
			id="help-title"
			style="border-bottom: 1px solid {theme.selection};"
		>
			Keyboard Shortcuts
		</h2>

		<div class="grid gap-4">
			<div>
				<h3 class="mb-2 font-bold">Navigation</h3>
				<ul class="grid gap-2">
					{#each links as link}
						<li class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								{#if iconMap[link.id]}
									{@const Icon = iconMap[link.id]}
									<Icon class="h-4 w-4" />
								{/if}
								<span>{link.title}</span>
							</div>
							<kbd
								class="rounded px-2 py-1 text-xs"
								style="background-color: {theme.selection}; color: {theme.foreground};"
							>
								{link.keybind}
							</kbd>
						</li>
					{/each}
				</ul>
			</div>

			<div>
				<h3 class="mb-2 font-bold">General</h3>
				<ul class="grid gap-2">
					<li class="flex justify-between">
						<span>Toggle Help</span>
						<kbd
							class="rounded px-2 py-1 text-xs"
							style="background-color: {theme.selection}; color: {theme.foreground};"
						>
							Shift + ?
						</kbd>
					</li>
					<li class="flex justify-between">
						<span>Toggle Theme</span>
						<kbd
							class="rounded px-2 py-1 text-xs"
							style="background-color: {theme.selection}; color: {theme.foreground};"
						>
							Shift + T
						</kbd>
					</li>
					<li class="flex justify-between">
						<span>Close/Cancel</span>
						<kbd
							class="rounded px-2 py-1 text-xs"
							style="background-color: {theme.selection}; color: {theme.foreground};"
						>
							{keybinds.escape}
						</kbd>
					</li>
				</ul>
			</div>
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
				Press Escape to close
			</div>
		</div>
	</div>
</div>
