<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    subtitle?: string;
    children?: Snippet;
  }

  let { title, subtitle, children }: Props = $props();
</script>

<div class="flex items-center justify-between">
  <div>
    <h1 class="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] text-[var(--color-neutral-900)]">{title}</h1>
    {#if subtitle}
      <p class="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-neutral-500)]">{subtitle}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex items-center gap-[var(--space-3)]">
      {@render children()}
    </div>
  {/if}
</div>
