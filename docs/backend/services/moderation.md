# Moderation Service

**Source:** `src/server/services/moderation.service.ts`
**Status:** Corrected; typecheck passed

## Purpose

The Moderation Service applies administrative actions to reported content and user accounts. It records moderation decisions and updates report status.

It works with the Reports Service and Admin Service.

## Supported actions

| Action | Current behavior |
|---|---|
| Warning | Records a warning without changing the account or content. |
| Hide | Hides a post or comment, or soft-deletes a message. |
| Suspend | Changes the account status to `suspended`, optionally recording an expiry date. |
| Ban | Changes the account status to `suspended` without an expiry date. |

A ban is treated as permanent by policy, but the current database represents it using the same `suspended` account status as a temporary suspension.

## Functions

### `applyModerationAction(actorId, input)`

Applies a moderation action to the target of a report.

Input:
- `reportId`: UUID of the report.
- `actionType`: warning, hide, suspend, or ban.
- `reason`: required text between 3 and 1000 characters.
- `expiresAt`: optional date, permitted only for suspension.

Behavior:
1. Validates the actor ID and input.
2. Validates suspension expiry dates.
3. Checks the administrator's role and active account status inside the transaction.
4. Locks the administrator role and report rows while processing.
5. Rejects reports that do not exist or are already resolved/dismissed.
6. Identifies the reported user from the report or target content.
7. Prevents administrators from moderating their own accounts or content.
8. Protects owner accounts and restricts moderation of other administrative accounts.
9. Applies the requested action.
10. Inserts a moderation action record.
11. Marks the report as resolved.

The target change, action record, and report update are performed in one database transaction.

### `getModerationActions(actorId, options)`

Returns moderation actions, newest first.

Accessible to all active administrative roles.

Options:
- `limit`: default 20, minimum 1, maximum 100.
- `offset`: default 0, maximum 100000.

### `getUserModerationHistory(actorId, targetUserId, options)`

Returns moderation actions associated with a particular target user, newest first.

Accessible to all active administrative roles.

The target ID and pagination options are validated.

## Authorization rules

- Owner and admin can perform all supported moderation actions.
- Moderator can issue warnings and hide content only.
- Only an active administrator can access moderation history.
- An administrator cannot moderate their own account or content.
- The platform owner cannot be moderated through this service.
- Admin and moderator accounts can only be moderated by the owner.
- The acting administrator's role is checked again inside the moderation transaction.

## Database dependencies

The service uses:

- `admin_users`
- `profiles`
- `reports`
- `posts`
- `comments`
- `messages`
- `moderation_actions`

The `moderation_actions` table records:
- Administrator ID
- Target user ID
- Report ID
- Action type
- Reason
- Optional expiry
- Creation timestamp

The administrator, target, and report references are nullable and use `ON DELETE SET NULL`.

## Current limitations

### 1. Suspension expiry is not automatic

The service records an expiry date but does not restore the account when the date passes.

A scheduled process is required.

### 2. Ban and suspension share one account status

Both currently set `profiles.accountStatus` to `suspended`.

The moderation action history distinguishes them, but the profile status does not.

### 3. No moderation reversal workflow

There is no dedicated service operation for reversing a moderation decision or restoring hidden content.

### 4. No dedicated audit event history

The moderation action table records the decision, but there is no separate append-only audit system for administrative changes and reversals.

### 5. Concurrent account-status changes

The transaction protects report processing and checks administrator permissions again. A broader review of concurrent account-status changes and overlapping moderation actions is still needed.

### 6. No automatic notification integration

This service does not directly notify the affected user when an action is taken.

## Recommended future improvements

These improvements are deliberately deferred.

| Improvement | Recommended implementation |
|---|---|
| Automatic suspension expiry | Scheduled server-side job that checks expired suspensions and restores eligible accounts. |
| Permanent ban status | Introduce a distinct `banned` account status through a database migration. |
| Overlapping suspension rules | Check for newer active suspensions or bans before restoring an account. |
| Moderation reversal | Add an authorized reversal operation with a recorded reason. |
| Audit history | Introduce append-only administrative audit records. |
| Stronger concurrency guarantees | Review transaction isolation and database constraints. |

### Recommended suspension-expiry process

When implemented, the scheduled job should:

1. Find expired suspension actions.
2. Check whether the target has a newer suspension or permanent ban.
3. Restore the account only when no newer restriction applies.
4. Record the restoration decision.
5. Avoid repeatedly processing the same expired action.

The expiry process must not reactivate an account that has subsequently been permanently banned or suspended again.

## Controller integration requirements

When API routes are introduced:

- Obtain the acting administrator ID from the verified Supabase session.
- Never trust an actor ID supplied by the client.
- Call the appropriate authorization checks before protected operations.
- Validate request bodies and query parameters.
- Keep moderation operations restricted to authenticated administrative users.
