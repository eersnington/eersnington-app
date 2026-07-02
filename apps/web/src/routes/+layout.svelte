<script lang="ts">
	import './layout.css';
	import icon from '$lib/assets/icon.png';
	import config from '$lib/config';

	let { children } = $props();
</script>

<svelte:head>
	<title>{config.pageTitle}</title>
	<link rel="icon" type="image/png" href={icon} />
	<link rel="canonical" href={config.siteUrl} />
	<meta name="robots" content="index, follow" />
	<meta name="author" content={config.title} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="font-mono">
	{@render children()}
</div>
