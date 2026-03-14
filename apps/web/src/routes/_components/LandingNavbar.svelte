<script lang="ts">
  import { onMount } from "svelte";

  let scrolled = $state(false);

  onMount(() => {
    function handleScroll() {
      scrolled = window.scrollY > 10;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  });
</script>

<nav
  class="fixed top-0 left-0 right-0 z-50 transition-[border-color,background-color] duration-300"
  style="background-color: {scrolled ? 'rgba(255,255,255,0.9)' : 'transparent'}; backdrop-filter: {scrolled ? 'blur(12px)' : 'none'}; border-bottom: 1px solid {scrolled ? '#e2e8f0' : 'transparent'};"
>
  <div class="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
    <a href="/" class="font-mono text-lg font-semibold text-[#0f172a]">
      iptoassets
    </a>

    <div class="flex items-center gap-6">
      <a href="#features" class="hidden text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors sm:block">
        Features
      </a>
      <a href="#pricing" class="hidden text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors sm:block">
        Pricing
      </a>
      <a href="/login" class="text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors">
        Sign in
      </a>
      <a
        href="/login"
        class="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
      >
        Get Started
      </a>
    </div>
  </div>
</nav>
