<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    position?: "top" | "bottom";
    children: Snippet;
  }

  let { position = "top", children, class: className = "", ...rest }: Props = $props();
</script>

<div
  class="backdrop-blur-[var(--backdrop-blur)] bg-[var(--glass-bg)] {position === 'top' ? 'border-b' : 'border-t'} border-[var(--border-color)] {className}"
  {...rest}
>
  {@render children()}
</div>
