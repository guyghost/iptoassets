<script lang="ts">
  import type { AssetStatus } from "@ipms/shared";
  import Badge from "../atoms/Badge.svelte";

  interface Props {
    status: AssetStatus;
  }

  let { status }: Props = $props();

  const statusConfig: Record<AssetStatus, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
    draft: { variant: "default", label: "Draft" },
    filed: { variant: "info", label: "Filed" },
    published: { variant: "info", label: "Published" },
    granted: { variant: "success", label: "Granted" },
    expired: { variant: "warning", label: "Expired" },
    abandoned: { variant: "danger", label: "Abandoned" },
  };

  const config = $derived(statusConfig[status]);
</script>

<Badge variant={config.variant}>{config.label}</Badge>
