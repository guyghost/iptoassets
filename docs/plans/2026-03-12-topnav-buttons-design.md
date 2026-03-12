# Top Nav Buttons — Design

## Goal

Make the three existing topnav buttons (settings, notifications, profile) functional.

## Decisions

### Settings (gear icon)
- Navigates to `/settings`
- New settings page with sidebar layout and placeholder sections: General, Notifications, Organization

### Notifications (bell icon)
- Opens a slide-over panel from the right edge
- Mock notification data (deadline reminders, status changes, document reviews)
- Each notification: icon, title, description, timestamp, read/unread state
- Mark as read, dismiss individual notifications
- Backdrop overlay to close
- "View all" link (placeholder)

### Profile (user avatar)
- Click opens a dropdown popover anchored below the avatar
- Shows user name + email (from layout server data)
- "Profile" link (placeholder)
- "Sign out" button — calls `authClient.signOut()` from Better Auth, redirects to `/login`

## Structure

### NavActions (packages/ui) — presentational
- Accepts callback props: `onsettingsclick`, `onnotificationsclick`, `onprofileclick`
- Does not handle navigation or auth — just emits events

### App layout (apps/web/src/routes/(app)/+layout.svelte) — behavioral
- Wires NavActions callbacks to:
  - Settings: `goto('/settings')`
  - Notifications: toggles slide-over panel open/closed
  - Profile: toggles dropdown open/closed

### New components (apps/web/src/features/)
- `notifications/NotificationPanel.svelte` — slide-over panel with mock data
- `profile/ProfileDropdown.svelte` — popover with user info + sign out

### New route
- `apps/web/src/routes/(app)/settings/+page.svelte` — settings page with placeholder sections
