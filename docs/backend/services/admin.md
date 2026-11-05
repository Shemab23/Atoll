# Admin Service

**Source:** `src/server/services/admin.service.ts`
**Status:** Corrected; typecheck passed

## Purpose

The Admin Service manages administrative access and enforces role-based permissions for platform administration, report review, and moderation.

Administrative roles are stored in the private `admin_users` table. A user without an admin record is an ordinary user.

## Roles and permissions

| Role | Report review | Moderation | Manage admin roles |
|---|---|---|---|
| Owner | Yes | All actions | Yes |
| Admin | Yes | All actions | No |
| Moderator | Yes | Warning and hide only | No |

Ownership cannot be granted, changed, or revoked through this service. Initial owner provisioning must be handled separately.

## Functions

### `getAdminRole(userId)`

Returns the user's administrative role, or `null` if the user has no admin record.

Validates the supplied user ID as a UUID. This function does not independently check account status.

### `requireAdmin(userId)`

Requires the user to have an administrative role and an active profile.

Returns the user's role. Throws an authorization error if the user is not an administrator or their account is inactive.

### `requireOwner(userId)`

Requires an active owner account. Other administrative roles are rejected.

### `requireReportAccess(userId)`

Requires an active administrative account. All three administrative roles are allowed to review reports.

### `requireModerationPermission(userId, actionType)`

Checks whether the user's role permits a moderation action.

- Owner and admin: warning, hide, suspend, and ban.
- Moderator: warning and hide only.

The action type is validated against the supported action values.

### `getAdminUsers(actorId)`

Returns the administrator list, including role, grant information, timestamps, username, display name, and account status.

Owner only.

### `grantAdminRole(actorId, input)`

Grants or changes an admin or moderator role.

Requirements:
- The actor must be an active owner.
- The target profile must exist and be active.
- The actor cannot change their own role.
- An existing owner role cannot be changed.
- The operation runs in a database transaction.
- The actor's owner role is rechecked and locked inside the transaction.

The grant operation records the acting owner's ID in `grantedBy`.

### `revokeAdminRole(actorId, targetUserId)`

Removes an admin or moderator role.

Requirements:
- The actor must be an active owner.
- The actor cannot remove their own role.
- The owner role cannot be removed.
- The authorization check and deletion run in one transaction.
- The actor's owner role is rechecked and locked inside the transaction.

## Security rules

1. The `admin_users` table is the source of truth for administrative roles.
2. Administrative operations require an active profile.
3. Only the owner can grant or revoke admin and moderator roles.
4. Moderators cannot suspend or ban accounts.
5. The service validates user IDs and moderation action types.
6. Role changes use transactions and lock relevant rows.
7. Ownership cannot be changed through the ordinary role-management functions.

## Database dependencies

The service uses:

- `admin_users`
- `profiles`

The `admin_users.user_id` column has a unique index, so a user can have only one administrative role.

The schema does not enforce a single owner across the entire platform. Owner uniqueness therefore remains a database-level safeguard to consider separately.

## Known limitations and future considerations

- Initial owner provisioning is outside this service.
- There is no dedicated administrative audit-history table recording every grant, revocation, or administrative action.
- The database does not enforce that only one owner exists.
- Role authorization is based on database records; custom JWT role claims are not implemented.
- Administrative actions must obtain the authenticated user ID from the verified server session when controllers are introduced. They must not trust a client-supplied actor ID.
- Concurrent account-status changes and role changes should be considered in a later database security review.

## Controller integration requirements

When API routes are introduced:

- Derive `actorId` from the verified Supabase session.
- Never accept an administrative actor ID as trusted client input.
- Call the relevant permission function before executing protected operations.
- Keep role-management operations restricted to the owner.
