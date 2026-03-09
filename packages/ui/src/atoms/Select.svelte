<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    label?: string;
    options: Option[];
    value?: string;
    error?: string;
    id?: string;
  }

  let { label, options, value = $bindable(), error, id }: Props = $props();
</script>

<div class="flex flex-col gap-[var(--space-1)]">
  {#if label}
    <label for={id} class="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--color-neutral-700)]">
      {label}
    </label>
  {/if}
  <select
    {id}
    bind:value
    class="rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] text-[var(--color-neutral-900)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)] {error ? 'border-[var(--color-danger-500)]' : 'border-[var(--border-color)]'}"
  >
    {#each options as option (option.value)}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  {#if error}
    <p class="text-[var(--text-xs)] text-[var(--color-danger-600)]">{error}</p>
  {/if}
</div>
