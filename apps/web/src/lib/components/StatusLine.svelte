<script lang="ts">
const {
  mode,
  file,
  position,
  filetype,
  theme,
  helpText,
  currentTheme,
}: {
  mode: string;
  file: string;
  position: { line: number; col: number };
  filetype: string;
  theme: {
    statusLine: string;
    statusLineText: string;
    normalMode: string;
    normalModeText: string;
  };
  helpText?: string;
  currentTheme?: string;
} = $props();
</script>

<div
	class="flex h-8 items-center text-xs"
	style="background-color: {theme.statusLine}; color: {theme.statusLineText}"
>
	<div
		class="flex h-full items-center px-3 font-bold"
		style="background-color: {theme.normalMode}; color: {theme.normalModeText}"
	>
		{mode}
	</div>
	<div class="px-3">{file}</div>
	{#if helpText}
		<div class="ml-4 hidden px-3 opacity-70 md:flex">{helpText}</div>
	{/if}
	<div class="ml-auto flex items-center gap-4 px-3">
		{#if currentTheme}
			<span>Theme: {currentTheme}</span>
		{/if}
		<span>{filetype}</span>
		<span>{position.line}:{position.col}</span>
	</div>
</div>
