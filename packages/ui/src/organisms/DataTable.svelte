<script lang="ts">
  import type { Snippet } from "svelte";

  interface Column {
    key: string;
    label: string;
    align?: "left" | "right";
  }

  interface Props {
    columns: Column[];
    rows: Record<string, any>[];
    children?: Snippet<[{ row: Record<string, any>; column: Column }]>;
  }

  let { columns, rows, children }: Props = $props();
</script>

{#if rows.length === 0}
  <div class="py-[var(--space-12)] text-center text-[var(--color-neutral-500)]">
    <p class="text-[var(--text-lg)]">No data available</p>
  </div>
{:else}
  <div class="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border-color)]">
    <table class="w-full text-left text-[var(--text-sm)]">
      <thead class="border-b border-[var(--border-color)] bg-[var(--color-neutral-50)]">
        <tr>
          {#each columns as column (column.key)}
            <th
              class="px-[var(--space-4)] py-[var(--space-3)] font-[var(--font-weight-medium)] text-[var(--color-neutral-700)] {column.align === 'right' ? 'text-right' : 'text-left'}"
            >
              {column.label}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--border-color)]">
        {#each rows as row, i (i)}
          <tr class="bg-white hover:bg-[var(--color-neutral-50)]">
            {#each columns as column (column.key)}
              <td
                class="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-neutral-900)] {column.align === 'right' ? 'text-right' : 'text-left'}"
              >
                {#if children}
                  {@render children({ row, column })}
                {:else}
                  {row[column.key] ?? ""}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
