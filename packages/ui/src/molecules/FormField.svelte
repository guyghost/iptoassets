<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    label: string;
    error?: string;
    id?: string;
    children: Snippet;
  }

  let { label, error, id, children }: Props = $props();
</script>

<div class="flex flex-col gap-[var(--space-1)]">
  <label for={id} class="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--color-neutral-700)]">
    {label}
  </label>
  {@render children()}
  {#if error}
    <p class="text-[var(--text-xs)] text-[var(--color-danger-600)]">{error}</p>
  {/if}
</div>
