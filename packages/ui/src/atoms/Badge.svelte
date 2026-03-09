<script lang="ts">
  import type { Snippet } from "svelte";

  type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

  interface Props {
    variant?: BadgeVariant;
    children: Snippet;
  }

  let { variant = "default", children }: Props = $props();

  const variantClasses: Record<BadgeVariant, string> = {
    default: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
    success: "bg-green-100 text-[var(--color-success-700)]",
    warning: "bg-amber-100 text-[var(--color-warning-700)]",
    danger: "bg-red-100 text-[var(--color-danger-700)]",
    info: "bg-blue-100 text-[var(--color-primary-700)]",
  };
</script>

<span
  class="inline-flex items-center rounded-[var(--radius-full)] px-[var(--space-2)] py-[var(--space-1)] text-[var(--text-xs)] font-[var(--font-weight-medium)] {variantClasses[variant]}"
>
  {@render children()}
</span>
