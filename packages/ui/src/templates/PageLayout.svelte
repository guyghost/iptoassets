<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="mx-auto flex max-w-7xl flex-col gap-[var(--space-8)] px-[var(--space-6)] py-[var(--space-8)]">
  {@render children()}
</div>
