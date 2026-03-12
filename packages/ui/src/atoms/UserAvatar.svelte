<script lang="ts">
  type Size = "sm" | "md" | "lg";

  interface Props {
    initials: string;
    size?: Size;
    class?: string;
  }

  let { initials, size = "md", class: className = "" }: Props = $props();

  const sizeClasses: Record<Size, string> = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };
</script>

<button
  class="flex items-center justify-center rounded-full bg-[var(--color-primary-100)] font-semibold text-[var(--color-primary-700)] cursor-pointer transition-colors hover:bg-[var(--color-primary-200)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] {sizeClasses[size]} {className}"
  aria-label="User menu"
  data-testid="user-avatar"
>
  {initials}
</button>
