<script lang="ts">
  interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: "deadline" | "status" | "review";
  }

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let notifications = $state<Notification[]>([
    {
      id: "1",
      title: "Patent renewal due",
      description: "US-2024-001234 renewal deadline in 7 days",
      time: "2 hours ago",
      read: false,
      type: "deadline",
    },
    {
      id: "2",
      title: "Status changed to Granted",
      description: "EP-2023-005678 has been granted by EPO",
      time: "5 hours ago",
      read: false,
      type: "status",
    },
    {
      id: "3",
      title: "Document review requested",
      description: "Filing application for TM-2024-009012 needs your review",
      time: "1 day ago",
      read: true,
      type: "review",
    },
    {
      id: "4",
      title: "Office action response overdue",
      description: "US-2023-003456 response was due 2 days ago",
      time: "2 days ago",
      read: true,
      type: "deadline",
    },
    {
      id: "5",
      title: "New asset filed",
      description: "CN-2024-007890 has been filed with CNIPA",
      time: "3 days ago",
      read: true,
      type: "status",
    },
  ]);

  const unreadCount = $derived(notifications.filter((n) => !n.read).length);

  function markAsRead(id: string) {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: string) {
    notifications = notifications.filter((n) => n.id !== id);
  }

  function markAllAsRead() {
    notifications = notifications.map((n) => ({ ...n, read: true }));
  }

  const typeIcons: Record<string, { bg: string; text: string }> = {
    deadline: { bg: "bg-amber-100", text: "text-amber-600" },
    status: { bg: "bg-emerald-100", text: "text-emerald-600" },
    review: { bg: "bg-blue-100", text: "text-blue-600" },
  };
</script>

{#if open}
  <!-- Backdrop -->
  <button
    class="fixed inset-0 z-40 bg-black/20 transition-opacity"
    aria-label="Close notifications"
    onclick={onclose}
    tabindex="-1"
  ></button>

  <!-- Slide-over panel -->
  <div class="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--border-color)] bg-white shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
      <div class="flex items-center gap-2">
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Notifications</h2>
        {#if unreadCount > 0}
          <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary-500)] px-1.5 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if unreadCount > 0}
          <button
            class="text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
            onclick={markAllAsRead}
          >
            Mark all read
          </button>
        {/if}
        <button
          class="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-600)]"
          aria-label="Close"
          onclick={onclose}
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Notification list -->
    <div class="flex-1 overflow-y-auto">
      {#if notifications.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <svg class="h-10 w-10 text-[var(--color-neutral-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
          <p class="mt-3 text-sm text-[var(--color-neutral-500)]">No notifications</p>
        </div>
      {:else}
        {#each notifications as notification (notification.id)}
          <div
            class="flex items-start gap-3 border-b border-[var(--border-color)] px-5 py-4 transition-colors {notification.read ? '' : 'bg-[var(--color-primary-50)]/30'}"
          >
            <!-- Type icon -->
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg {typeIcons[notification.type]?.bg ?? 'bg-gray-100'} {typeIcons[notification.type]?.text ?? 'text-gray-600'}">
              {#if notification.type === "deadline"}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {:else if notification.type === "status"}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {:else}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
              {/if}
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-[var(--color-neutral-900)] {notification.read ? '' : 'font-semibold'}">
                  {notification.title}
                </p>
                <button
                  class="shrink-0 text-[var(--color-neutral-300)] hover:text-[var(--color-neutral-500)]"
                  aria-label="Dismiss"
                  onclick={() => dismiss(notification.id)}
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <p class="mt-0.5 text-xs text-[var(--color-neutral-500)]">{notification.description}</p>
              <div class="mt-1.5 flex items-center gap-3">
                <span class="text-[11px] text-[var(--color-neutral-400)]">{notification.time}</span>
                {#if !notification.read}
                  <button
                    class="text-[11px] font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                    onclick={() => markAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                {/if}
              </div>
            </div>

            <!-- Unread dot -->
            {#if !notification.read}
              <div class="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary-500)]"></div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}
