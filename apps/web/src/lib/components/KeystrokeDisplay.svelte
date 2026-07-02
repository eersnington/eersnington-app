<script lang="ts">
const DISPLAY_TIMEOUT = 1500;

const {
  keyBuffer,
  theme,
}: {
  keyBuffer: string;
  theme: { background: string; foreground: string; selection: string };
} = $props();

let visible = $state(false);
let displayText = $state('');

$effect(() => {
  if (keyBuffer) {
    displayText = keyBuffer;
    visible = true;

    const timer = setTimeout(() => {
      visible = false;
    }, DISPLAY_TIMEOUT);

    return () => clearTimeout(timer);
  }
});
</script>

{#if visible}
	<div class="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
		<div
			class="rounded-md px-6 py-3 font-mono text-2xl"
			style="background-color: {theme.selection}99; color: {theme.foreground}; border: 1px solid {theme.foreground}33; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);"
		>
			{displayText}
		</div>
	</div>
{/if}
