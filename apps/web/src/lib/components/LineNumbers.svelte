<script lang="ts">
const {
  count,
  currentLine,
  color,
}: { count: number; currentLine: number; color: string } = $props();
</script>

<div
	class="absolute top-0 left-0 hidden h-full w-8 select-none flex-col items-end pl-9 font-bold text-lg md:flex"
	style="color: {color}"
>
	{#each Array.from({ length: count }, (_, i) => i + 1) as lineNum}
		<div
			class="h-6"
			class:font-bold={lineNum === currentLine}
			class:opacity-70={lineNum !== currentLine}
		>
			{lineNum}
		</div>
	{/each}
</div>
