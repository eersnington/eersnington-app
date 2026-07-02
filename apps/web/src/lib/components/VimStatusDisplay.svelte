<script lang="ts">
const { mode, keyBuffer }: { mode: string; keyBuffer: string } = $props();
</script>

<div class="mt-8 text-center text-sm opacity-50">
	<span class="mr-4">MODE: {mode}</span>
	{#if keyBuffer}
		<span>KEYS: {keyBuffer}</span>
	{/if}
</div>
