# Reports Service

**Source:** `src/server/services/reports.service.ts`
**Status:** Corrected; TypeScript typecheck passed

## Purpose

The Reports Service allows users to report posts, comments, and messages. It derives the reported user's ID from the selected content rather than trusting a user-supplied ID.

It also provides administrative report retrieval and status management.

## Public functions

| Function | Responsibility |
|---|---|
| `createReport` | Create a report against a post, comment, or message |
| `getReports` | Retrieve a paginated administrative report queue |
| `getReportById` | Retrieve one report for administrative review |
| `updateReportStatus` | Change a report's review status |

## Validation and authorization

### Creating reports

- Reporter ID must be a valid UUID.
- Reporter must have an active profile.
- Input uses a strict discriminated Zod schema.
- Target ID must be a valid UUID.
- Reason must contain 2–80 characters.
- Description is optional and limited to 2,000 characters.
- The reported user is derived from the target record.
- Users cannot report their own content.

### Post reports

- Post must exist and have active status.
- Public posts are reportable by any active user.
- Followers-only posts require an existing follow relationship.
- Blocking does not prevent reporting.

### Comment reports

- Comment must exist and have active status.
- The reporter must be able to access the parent post.
- The reported user is derived from the comment author.
- Blocking does not prevent reporting.

### Message reports

- Message must exist and not be soft-deleted.
- Reporter must be an active member of the conversation.
- Reported user is derived from the message sender.

### Administrative access

All administrative report operations call `requireReportAccess`.

This delegates authorization to the Admin Service, which verifies that the actor has an administrative role and an active account.

### Pagination

- Default limit: 20
- Maximum limit: 100
- Minimum limit: 1
- Offset: 0–100,000
- Values must be integers.

## Report status transitions

| Current status | Allowed next statuses |
|---|---|
| `pending` | `reviewing`, `resolved`, `dismissed` |
| `reviewing` | `resolved`, `dismissed` |
| `resolved` | None |
| `dismissed` | None |

Repeating the current status is allowed as an idempotent operation.

Updates use a conditional database update to detect a concurrent status change.

## Database dependencies

- `reports`
- `profiles`
- `posts`
- `comments`
- `messages`
- `follows`

The Reports table enforces that exactly one target reference is populated: post, comment, or message.

## Important limitations and future improvements

1. **No reviewer audit trail:** The current Reports table does not store the administrator who reviewed a report or the review timestamp.
2. **No duplicate-report restriction:** The database permits multiple reports against the same content. This is intentional for the current implementation.
3. **No report reason allowlist:** Reasons are bounded strings, but the product has not yet defined approved reason categories.
4. **No report notification integration:** Report creation does not yet trigger an administrative notification.
5. **Status transition concurrency:** Conditional updates detect competing changes, but the full read-and-transition operation is not protected by a database transaction or row lock.
6. **Target access race:** Content access is checked before report insertion; content could change between those operations.

## Security notes

- Never accept `reportedUserId` directly from a client.
- Controllers must derive the reporter ID from the authenticated session.
- Administrative permissions must remain enforced server-side.
- Reports must remain possible even when the reporter has blocked the reported user.
- Do not expose privileged database credentials to clients.
