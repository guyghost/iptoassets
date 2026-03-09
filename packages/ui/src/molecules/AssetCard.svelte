<script lang="ts">
  import type { AssetStatus, IPType } from "@ipms/shared";
  import Card from "../atoms/Card.svelte";
  import StatusBadge from "./StatusBadge.svelte";

  interface Props {
    title: string;
    type: IPType;
    status: AssetStatus;
    jurisdiction: string;
    owner: string;
    href?: string;
  }

  let { title, type, status, jurisdiction, owner, href }: Props = $props();

  const typeLabels: Record<IPType, string> = {
    patent: "Patent",
    trademark: "Trademark",
    copyright: "Copyright",
    "design-right": "Design Right",
  };
</script>

<Card>
  <div class="flex items-start justify-between">
    <div>
      {#if href}
        <a {href} class="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)]">
          {title}
        </a>
      {:else}
        <h3 class="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--color-neutral-900)]">
          {title}
        </h3>
      {/if}
      <p class="mt-[var(--space-1)] text-[var(--text-sm)] text-[var(--color-neutral-500)]">
        {typeLabels[type]} &middot; {jurisdiction} &middot; {owner}
      </p>
    </div>
    <StatusBadge {status} />
  </div>
</Card>
