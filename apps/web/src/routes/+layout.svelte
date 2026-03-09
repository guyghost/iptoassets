<script>
  import "../app.css";
  let { children } = $props();
</script>

<div class="min-h-screen bg-[var(--color-neutral-50)] font-[var(--font-sans)]">
  <nav class="border-b border-[var(--border-color)] bg-white px-[var(--space-6)] py-[var(--space-4)]">
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <a href="/" class="text-[var(--text-xl)] font-[var(--font-weight-bold)] text-[var(--color-primary-700)]">
        IPMS
      </a>
      <div class="flex gap-[var(--space-6)]">
        <a href="/assets" class="text-[var(--text-sm)] text-[var(--color-neutral-600)] hover:text-[var(--color-primary-600)]">Assets</a>
        <a href="/portfolios" class="text-[var(--text-sm)] text-[var(--color-neutral-600)] hover:text-[var(--color-primary-600)]">Portfolios</a>
        <a href="/deadlines" class="text-[var(--text-sm)] text-[var(--color-neutral-600)] hover:text-[var(--color-primary-600)]">Deadlines</a>
      </div>
    </div>
  </nav>
  <main class="mx-auto max-w-7xl px-[var(--space-6)] py-[var(--space-8)]">
    {@render children()}
  </main>
</div>
