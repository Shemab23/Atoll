# Notifications Service

**Source:** `src/server/services/notifications.service.ts`
**Status:** Corrected; TypeScript typecheck passed

## Purpose

The Notifications Service creates and manages user notifications. Users can retrieve their notifications, check unread counts, mark notifications as read, and delete notifications.

## Public functions

| Function | Responsibility |
|---|---|
| `createNotification` | Create a notification for a recipient |
| `getUserNotifications` | Retrieve a user's notifications |
| `getUnreadNotificationCount` | Count unread notifications |
| `markNotificationAsRead` | Mark one notification as read |
| `markAllNotificationsAsRead` | Mark all notifications as read |
| `deleteNotification` | Delete one notification |
| `deleteAllNotifications` | Delete all notifications belonging to a user |

## Validation and authorization

### Notification creation

- Uses a strict Zod input schema.
- Recipient and actor IDs must be valid UUIDs.
- Reference ID must be a valid UUID.
- Notification type and reference type must contain 1–50 characters after trimming.
- Recipient must have an active profile.
- Self-notifications are skipped and return `null`.
- Actor may be `null`.

Notification creation is intended for trusted server-side workflows, not direct client input.

### Retrieving notifications

- User must have an active account.
- Queries are scoped to the supplied recipient ID.
- Optional unread-only filtering is supported.
- Results are ordered by creation time and ID, newest first.

### Pagination

- Default limit: 30
- Minimum limit: 1
- Maximum limit: 100
- Offset: 0–100,000
- Limit and offset must be integers.

### Reading notifications

- User must have an active account.
- Updates are scoped by both notification ID and recipient ID.
- Mark-all-read affects only unread notifications belonging to that user.

### Deleting notifications

- Deletion is scoped to the recipient.
- User and notification IDs must be valid UUIDs.
- Deletion does not require an active account, allowing notification cleanup after suspension.

## Database dependencies

- `notifications`
- `profiles`

The Notifications table includes:
- Recipient ID
- Optional actor ID
- Notification type
- Reference ID and reference type
- Read status
- Creation timestamp

Indexes support recipient/read-status filtering and recipient/creation-time ordering.

## Important limitations and future improvements

1. **Unrestricted notification types:** Notification and reference types are text fields. An explicit allowlist should be introduced after notification events are defined.
2. **Reference integrity:** `referenceId` has no foreign key. The service does not verify that referenced content still exists.
3. **No orchestration:** Creating a post, comment, follow, or message does not automatically create a notification through this service.
4. **No notification preferences:** The service does not yet apply users' notification preferences.
5. **No delivery mechanism:** The service only stores database records. Push notifications and other delivery mechanisms are not implemented here.
6. **No duplicate prevention:** The database does not prevent repeated notifications for the same event.
7. **No pagination cursor:** Retrieval currently uses offset pagination.

## Security notes

- Notification queries and mutations must always be scoped to the authenticated recipient.
- Controllers must derive user IDs from the authenticated session.
- Notification creation must be called by trusted server-side workflows.
- Never expose privileged database credentials to clients.
- Notification creation should not cause an otherwise successful user action to fail merely because notification delivery or storage fails. Orchestration must handle this deliberately.
