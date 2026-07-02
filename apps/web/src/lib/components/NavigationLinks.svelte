<script lang="ts">
import Github from 'lucide-svelte/icons/github';
import Linkedin from 'lucide-svelte/icons/linkedin';
import Mail from 'lucide-svelte/icons/mail';
import Twitter from 'lucide-svelte/icons/twitter';
import Youtube from 'lucide-svelte/icons/youtube';
import type { Theme } from '$lib/themes';
import type { Link } from '$lib/types';

const {
  links,
  selectedIndex,
  theme,
  onLinkActivate,
  onSelectIndex,
}: {
  links: readonly Link[];
  selectedIndex: number;
  theme: Theme['colors'];
  onLinkActivate: (link: Link) => void;
  onSelectIndex?: (index: number) => void;
} = $props();

const iconMap: Record<string, typeof Github> = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  email: Mail,
};

function handleMouseEnter(index: number, isActive: boolean) {
  if (!isActive && onSelectIndex) {
    onSelectIndex(index);
  }
}

function handleClick(link: Link, event: MouseEvent) {
  event.preventDefault();
  onLinkActivate(link);
}
</script>

<div class="grid w-full max-w-md gap-4">
	{#each links as link, index}
		{@const isActive = index === selectedIndex}
		<a
			aria-current={isActive ? 'true' : undefined}
			aria-label="{link.title} - Press {link.keybind} or Enter"
			class="flex items-center justify-between px-4 py-2"
			href={link.url}
			onclick={(e) => handleClick(link, e)}
			onmouseenter={() => handleMouseEnter(index, isActive)}
			rel="noopener noreferrer"
			style="background-color: {isActive ? theme.selection : 'transparent'}; color: {theme.foreground}; border-left: 2px solid {isActive ? theme.accent : 'transparent'}; cursor: pointer;"
			tabindex={isActive ? 0 : -1}
			target="_blank"
		>
			<div class="flex items-center gap-3 text-lg">
				{#if iconMap[link.id]}
					{@const Icon = iconMap[link.id]}
					<Icon class="size-6" />
				{/if}
				<span>{link.title}</span>
			</div>
			<span class="text-lg opacity-70">{link.keybind}</span>
		</a>
	{/each}
</div>
