# Blocks Service

**Source:** `src/server/services/blocks.service.ts`
**Status:** Corrected; TypeScript check passed
**Database tables:** `blocks`, `follows`, `profiles`

## 1. Purpose

The Blocks Service manages user blocking relationships.

It allows users to:
- Block another user.
- Remove a block they created.
- Check whether two users have a blocking relationship.
- Check whether one specific user has blocked another.
- Retrieve their blocked-user list.

Blocking also removes existing follow relationships in both directions.

## 2. Exported functions

| Function | Responsibility |
|---|---|
| `hasBlockBetweenUsers(firstUserId, secondUserId)` | Checks whether either user has blocked the other. |
| `hasUserBlocked(blockerId, blockedId)` | Checks whether a specific directional block exists. |
| `blockUser(blockerId, input)` | Creates a block and removes existing follows in both directions. |
| `unblockUser(blockerId, blockedId)` | Removes a block created by the specified user. |
| `getBlockedUsers(userId)` | Retrieves users blocked by the specified user. |

## 3. Validation

The service validates user IDs as UUIDs.

The block creation input is strictly validated:

```typescript
{
  userId: string;
}
```

Unknown input properties are rejected.

Invalid IDs or block targets produce application errors.

## 4. Account and authorization rules

### Blocking

- The acting user must have an active account.
- The target user must exist.
- A user cannot block themselves.
- A user can block another user even if the target account is inactive, provided the target profile still exists.
- Repeating an existing block is safe and does not create a duplicate.

The service does not authenticate requests itself. Controllers must derive the acting user's ID from the verified Supabase session.

### Unblocking

Unblocking deliberately does not require an active account.

This allows users to remove blocks even if their account status or other relationship conditions have changed.

A user can only remove a block they created. Unblocking does not remove a block created in the opposite direction.

## 5. Block creation and follow cleanup

`blockUser` performs these operations:

1. Validate the acting user's ID.
2. Validate the target ID.
3. Prevent self-blocking.
4. Verify that the acting account is active.
5. Verify that the target profile exists.
6. Start a database transaction.
7. Delete follow relationships in both directions.
8. Insert the block relationship if it does not already exist.
9. Return whether a new block was created.

The follow cleanup and block insertion occur in the same transaction.

If the transaction fails, its database changes are rolled back together.

The response is:

```typescript
{
  blocked: true;
  created: boolean;
}
```

`created` is `false` when the block already existed.

## 6. Block relationship checks

### `hasBlockBetweenUsers`

Returns `true` if either of these relationships exists:

- First user blocked second user.
- Second user blocked first user.

This is the general-purpose helper for preventing interactions between two users.

### `hasUserBlocked`

Checks only one direction.

For example, it can determine whether user A specifically blocked user B without treating a block from B to A as equivalent.

## 7. Blocked-user list

`getBlockedUsers` returns:

- User ID
- Username
- Display name
- Avatar URL
- Block creation timestamp (`blockedAt`)

Results are ordered by newest block first.

The requesting account must be active.

## 8. Dependencies

| Dependency | Purpose |
|---|---|
| Drizzle ORM | Database queries and transactions. |
| `blocks` table | Stores directional blocking relationships. |
| `follows` table | Removes follow relationships when blocking. |
| `profiles` table | Verifies users and account status. |
| `AppError` | Consistent application errors. |
| Zod | Validates IDs and block input. |
| `server-only` | Prevents accidental client-side imports. |

## 9. Platform-wide integration requirements

A block must affect more than the block list.

Other services must use block checks to enforce these rules:

- Prevent following in either direction.
- Prevent private messaging between blocked users.
- Prevent blocked users from appearing in relevant discovery results.
- Prevent blocked users from interacting with each other's content according to the platform's visibility policy.
- Prevent blocked users' content from appearing in relevant feeds and interaction lists.
- Keep reporting available even when users have blocked each other.

The Blocks Service provides relationship checks, but it does not automatically enforce every one of these policies across the platform.

## 10. Unblocking behavior

Unblocking removes only the block record.

It does not restore follow relationships deleted when the block was created.

Users must establish new follow relationships themselves.

Existing conversation records are not deleted by this service.

## 11. Important implementation boundaries

The service does not currently:

- Delete or archive conversations.
- Delete messages or posts.
- Restore follow relationships after unblocking.
- Send notifications.
- Automatically remove reactions or comments.
- Enforce block checks in every other service.
- Authenticate the acting user.
- Provide a database-level concurrency guarantee against simultaneous follow and block operations.

The transaction ensures that follow cleanup and block insertion are atomic within this service. Other services must still account for concurrent operations.

## 12. Future integration points

When controllers are introduced:

- Derive `blockerId` from the verified Supabase session.
- Never trust a client-supplied blocker ID.
- Use `hasBlockBetweenUsers` in services that need bidirectional block enforcement.
- Keep reporting available despite blocks.
- Ensure conversation and messaging policies are consistent with block status.
- Consider database-level concurrency protection if simultaneous follow and block requests become a practical issue.

## 13. Verification

The corrected service passed:

```powershell
npx tsc --noEmit
```

This confirms TypeScript compatibility. Runtime tests are still needed for block creation, duplicate blocks, follow cleanup in both directions, unblocking, inactive accounts, and transaction rollback.
