<script lang="ts">
  import Icon from "../atoms/Icon.svelte";

  interface Props {
    placeholder?: string;
    value?: string;
  }

  let { placeholder = "Search...", value = $bindable("") }: Props = $props();
</script>

<div class="relative flex items-center">
  <div class="pointer-events-none absolute left-[var(--space-3)] text-[var(--color-neutral-400)]">
    <Icon name="search" size="sm" />
  </div>
  <input
    type="text"
    bind:value
    {placeholder}
    class="w-full rounded-[var(--radius-md)] border border-[var(--border-color)] py-[var(--space-2)] pl-[var(--space-10)] pr-[var(--space-10)] text-[var(--text-sm)] text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
  />
  {#if value}
    <button
      type="button"
      class="absolute right-[var(--space-3)] text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]"
      onclick={() => (value = "")}
    >
      <Icon name="x" size="sm" />
    </button>
  {/if}
</div>
