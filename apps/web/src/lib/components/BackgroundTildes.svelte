<script lang="ts">
	import { LAYOUT } from '$lib/constants';

	let { color }: { color: string } = $props();

	let containerRef = $state<HTMLDivElement | null>(null);
	let dynamicLineCount = $state(0);

	$effect(() => {
		const calculateLineCount = () => {
			if (containerRef) {
				const containerHeight = containerRef.clientHeight;
				const calculatedLines = Math.floor(containerHeight / LAYOUT.LINE_HEIGHT);
				dynamicLineCount = calculatedLines;
			}
		};

		calculateLineCount();

		window.addEventListener('resize', calculateLineCount);
		return () => window.removeEventListener('resize', calculateLineCount);
	});
</script>

<div
	class="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden font-bold text-lg"
	bind:this={containerRef}
>
	{#each Array.from({ length: dynamicLineCount }, (_, i) => i + 1) as lineNum}
		<div
			class="h-6 select-none"
			style="color: {color}"
		>
			~
		</div>
	{/each}
</div>
