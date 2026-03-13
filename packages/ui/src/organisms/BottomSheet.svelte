<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    onclose: () => void;
    children: Snippet;
  }

  let { open, onclose, children }: Props = $props();

  let visible = $state(false);

  $effect(() => {
    if (open) {
      requestAnimationFrame(() => { visible = true; });
    } else {
      visible = false;
    }
  });

  function handleOverlayClick() {
    visible = false;
    setTimeout(onclose, 300);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") handleOverlayClick();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 {visible ? 'opacity-100' : 'opacity-0'}"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
  ></div>

  <div
    class="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[var(--glass-bg-dark)] shadow-[var(--shadow-elevated)] backdrop-blur-[var(--backdrop-blur)] transition-transform duration-300 {visible ? 'translate-y-0' : 'translate-y-full'}"
    style="transition-timing-function: var(--ease-spring);"
  >
    <div class="flex justify-center pt-3 pb-1">
      <div class="h-1 w-10 rounded-full bg-[var(--color-neutral-300)]"></div>
    </div>
    <div class="px-4 pb-[calc(1rem+var(--space-safe-bottom))]">
      {@render children()}
    </div>
  </div>
{/if}
