<script lang="ts">
  import "@fontsource/geist-sans";
  import "@fontsource/geist-mono";

  import LandingNavbar from "./_components/LandingNavbar.svelte";
  import Hero from "./_components/Hero.svelte";
  import Benefits from "./_components/Benefits.svelte";
  import Features from "./_components/Features.svelte";
  import Testimonials from "./_components/Testimonials.svelte";
  import Pricing from "./_components/Pricing.svelte";
  import LandingFooter from "./_components/LandingFooter.svelte";
</script>

<svelte:head>
  <title>iptoassets — Modern IP Portfolio Management</title>
  <meta name="description" content="Track, protect, and grow your intellectual property. The modern platform for patent and trademark management." />
</svelte:head>

<div style="font-family: 'Geist Sans', ui-sans-serif, system-ui, sans-serif;">
  <LandingNavbar />
  <Hero />
  <Benefits />
  <Features />
  <Testimonials />
  <Pricing />
  <LandingFooter />
</div>

<style>
  div :global(.font-mono) {
    font-family: "Geist Mono", ui-monospace, monospace;
  }
</style>
