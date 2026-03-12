<script lang="ts">
  import IconButton from "../atoms/IconButton.svelte";
  import UserAvatar from "../atoms/UserAvatar.svelte";

  interface Props {
    userInitials?: string;
    notificationCount?: number;
    onsettingsclick?: () => void;
    onnotificationsclick?: () => void;
    onprofileclick?: () => void;
  }

  let {
    userInitials = "AG",
    notificationCount = 0,
    onsettingsclick,
    onnotificationsclick,
    onprofileclick,
  }: Props = $props();
</script>

<div class="flex items-center gap-2" data-testid="nav-actions">
  <IconButton
    icon="settings"
    aria-label="Settings"
    data-testid="nav-settings"
    onclick={onsettingsclick}
  />

  <div class="relative">
    <IconButton
      icon="bell"
      aria-label="Notifications"
      data-testid="nav-notifications"
      onclick={onnotificationsclick}
    />
    {#if notificationCount > 0}
      <span
        class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger-500)] text-[10px] font-bold text-white pointer-events-none"
        aria-label="{notificationCount} notifications"
      >
        {notificationCount > 9 ? "9+" : notificationCount}
      </span>
    {/if}
  </div>

  <div class="ml-1">
    <UserAvatar initials={userInitials} onclick={onprofileclick} />
  </div>
</div>
