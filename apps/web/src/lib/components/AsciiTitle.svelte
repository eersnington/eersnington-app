<script lang="ts">
    const { color }: { color: string } = $props();
    const asciiArt = `
███████╗██████╗ ███████╗███████╗    ███╗   ██╗ █████╗ ██████╗  █████╗ ██╗   ██╗ █████╗ ███╗   ██╗ █████╗ ███╗   ██╗
██╔════╝██╔══██╗██╔════╝██╔════╝    ████╗  ██║██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝██╔══██╗████╗  ██║██╔══██╗████╗  ██║
███████╗██████╔╝█████╗  █████╗      ██╔██╗ ██║███████║██████╔╝███████║ ╚████╔╝ ███████║██╔██╗ ██║███████║██╔██╗ ██║
╚════██║██╔══██╗██╔══╝  ██╔══╝      ██║╚██╗██║██╔══██║██╔══██╗██╔══██║  ╚██╔╝  ██╔══██║██║╚██╗██║██╔══██║██║╚██╗██║
███████║██║  ██║███████╗███████╗    ██║ ╚████║██║  ██║██║  ██║██║  ██║   ██║   ██║  ██║██║ ╚████║██║  ██║██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝`.trim();

    const shortAsciiArt = `
███████╗██████╗ ███████╗███████╗    ███╗   ██╗
██╔════╝██╔══██╗██╔════╝██╔════╝    ████╗  ██║
███████╗██████╔╝█████╗  █████╗      ██╔██╗ ██║
╚════██║██╔══██╗██╔══╝  ██╔══╝      ██║╚██╗██║
███████║██║  ██║███████╗███████╗    ██║ ╚████║
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝  ╚═══╝`.trim();

    const mobileAsciiArt = `
███████╗██████╗ ███████╗███████╗
██╔════╝██╔══██╗██╔════╝██╔════╝
███████╗██████╔╝█████╗  █████╗
╚════██║██╔══██╗██╔══╝  ██╔══╝
███████║██║  ██║███████╗███████╗
╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝`.trim();
</script>

<div
    class="relative flex h-50 w-full max-w-full items-center justify-center overflow-hidden text-center"
>
    <div class="overflow-x-auto">
        <!-- Full ASCII art for larger screens -->
        <pre
            class="hidden font-mono text-base leading-none lg:block"
            style="color: {color}">{asciiArt}</pre>

        <!-- Short ASCII art for medium screens -->
        <pre
            class="hidden font-mono text-base leading-none sm:block md:text-base lg:hidden"
            style="color: {color}">{shortAsciiArt}</pre>

        <!-- Mobile ASCII art for very small screens -->
        <pre
            class="block font-mono text-sm leading-none sm:hidden"
            style="color: {color}">{shortAsciiArt}</pre>
    </div>
</div>
