<script lang="ts">
  import { onMount } from "svelte";

  let { children, delay = 0, class: className = "" } = $props();

  let element: HTMLDivElement;
  let visible = $state(false);

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visible = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={element}
  class={className}
  style="opacity: {visible ? 1 : 0}; transform: translateY({visible ? 0 : 20}px); transition: opacity 500ms ease-out {delay}ms, transform 500ms ease-out {delay}ms;"
>
  {@render children()}
</div>
