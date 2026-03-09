<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Variant = "primary" | "secondary" | "danger" | "ghost";
  type Size = "sm" | "md" | "lg";

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    children: Snippet;
  }

  let { variant = "primary", size = "md", children, ...rest }: Props = $props();

  const variantClasses: Record<Variant, string> = {
    primary:
      "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] focus:ring-[var(--color-primary-500)]",
    secondary:
      "bg-white text-[var(--color-neutral-700)] border border-[var(--border-color)] hover:bg-[var(--color-neutral-50)] focus:ring-[var(--color-primary-500)]",
    danger:
      "bg-[var(--color-danger-600)] text-white hover:bg-[var(--color-danger-700)] focus:ring-[var(--color-danger-500)]",
    ghost:
      "bg-transparent text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] focus:ring-[var(--color-primary-500)]",
  };

  const sizeClasses: Record<Size, string> = {
    sm: "px-[var(--space-3)] py-[var(--space-1)] text-[var(--text-sm)]",
    md: "px-[var(--space-4)] py-[var(--space-2)] text-[var(--text-sm)]",
    lg: "px-[var(--space-6)] py-[var(--space-3)] text-[var(--text-base)]",
  };
</script>

<button
  class="inline-flex items-center justify-center rounded-[var(--radius-md)] font-[var(--font-weight-medium)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed {variantClasses[variant]} {sizeClasses[size]}"
  {...rest}
>
  {@render children()}
</button>
