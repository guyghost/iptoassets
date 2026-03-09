<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-white p-[var(--space-6)] shadow-[var(--shadow-sm)]">
  {@render children()}
</div>
