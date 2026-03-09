<script lang="ts">
  import type { AssetStatus, IPType } from "@ipms/shared";
  import AssetCard from "../molecules/AssetCard.svelte";

  interface AssetItem {
    id: string;
    title: string;
    type: IPType;
    status: AssetStatus;
    jurisdiction: { code: string; name: string };
    owner: string;
  }

  interface Props {
    assets: AssetItem[];
  }

  let { assets }: Props = $props();
</script>

{#if assets.length === 0}
  <div class="py-[var(--space-12)] text-center text-[var(--color-neutral-500)]">
    <p class="text-[var(--text-lg)]">No assets found</p>
    <p class="mt-[var(--space-2)] text-[var(--text-sm)]">Create your first IP asset to get started.</p>
  </div>
{:else}
  <div class="flex flex-col gap-[var(--space-4)]">
    {#each assets as asset (asset.id)}
      <AssetCard
        title={asset.title}
        type={asset.type}
        status={asset.status}
        jurisdiction={asset.jurisdiction.name}
        owner={asset.owner}
        href="/assets/{asset.id}"
      />
    {/each}
  </div>
{/if}
