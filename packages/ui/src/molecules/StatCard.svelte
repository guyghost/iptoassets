<script lang="ts">
  type AccentColor = "amber" | "red" | "emerald";

  interface Props {
    label: string;
    value: string;
    subtitle?: string;
    accent?: boolean;
    accentColor?: AccentColor;
  }

  let { label, value, subtitle, accent = false, accentColor = "amber" }: Props = $props();

  const accentClasses: Record<AccentColor, string> = {
    amber: "border-l-4 border-l-amber-400",
    red: "border-l-4 border-l-red-400",
    emerald: "border-l-4 border-l-emerald-400",
  };

  const accentBorder = $derived(accent ? accentClasses[accentColor] : "");
</script>

<div class="rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-white p-[var(--space-6)] shadow-[var(--shadow-sm)] {accentBorder}">
  <p class="text-[var(--text-sm)] font-[var(--font-weight-medium)] text-[var(--color-neutral-500)]">{label}</p>
  <p class="mt-[var(--space-2)] text-[var(--text-3xl)] font-[var(--font-weight-semibold)] text-[var(--color-neutral-900)]">{value}</p>
  {#if subtitle}
    <p class="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-neutral-500)]">{subtitle}</p>
  {/if}
</div>
