<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
  }

  let { label, error, id, ...rest }: Props = $props();
</script>

<div class="flex flex-col gap-[var(--space-1)]">
  {#if label}
    <label for={id} class="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--color-neutral-700)]">
      {label}
    </label>
  {/if}
  <input
    {id}
    class="rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)] {error ? 'border-[var(--color-danger-500)]' : 'border-[var(--border-color)]'}"
    {...rest}
  />
  {#if error}
    <p class="text-[var(--text-xs)] text-[var(--color-danger-600)]">{error}</p>
  {/if}
</div>
