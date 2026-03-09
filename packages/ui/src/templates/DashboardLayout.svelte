<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    sidebar: Snippet;
  }

  let { children, sidebar }: Props = $props();
</script>

<div class="flex gap-[var(--space-8)]">
  <main class="min-w-0 flex-1">
    {@render children()}
  </main>
  <aside class="w-80 shrink-0">
    {@render sidebar()}
  </aside>
</div>
