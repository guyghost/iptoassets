<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import Icon from "./Icon.svelte";

  type Size = "sm" | "md" | "lg";

  interface Props extends HTMLButtonAttributes {
    icon: string;
    size?: Size;
    "aria-label": string;
  }

  let { icon, size = "md", class: className = "", ...rest }: Props = $props();

  const sizeClasses: Record<Size, string> = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const iconSizes: Record<Size, "sm" | "md" | "lg"> = {
    sm: "sm",
    md: "md",
    lg: "lg",
  };
</script>

<button
  class="flex items-center justify-center rounded-full text-[var(--color-neutral-400)] transition-colors hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-600)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] {sizeClasses[size]} {className}"
  {...rest}
>
  <Icon name={icon} size={iconSizes[size]} />
</button>
