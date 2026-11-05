# Follows Service

**Source:** `src/server/services/follows.service.ts`
**Status:** Corrected; TypeScript check passed
**Database tables:** `follows`, `profiles`, `blocks`

## 1. Purpose

The Follows Service manages user-to-user follow relationships.

It supports:
- Following another user.
- Unfollowing a user.
- Checking whether one user follows another.
- Retrieving a user's followers.
- Retrieving the users a person follows.
- Counting followers and following relationships.

The service also checks account status and blocking relationships so that follow-related information and actions respect platform restrictions.

## 2. Exported functions

| Function | Responsibility |
|---|---|
| `followUser(followerId, targetUserId)` | Creates a follow relationship. |
| `unfollowUser(followerId, targetUserId)` | Removes an existing follow relationship. |
| `isFollowing(followerId, targetUserId)` | Checks whether a follow relationship exists and is accessible. |
| `getFollowers(userId, limit, offset)` | Retrieves users following the specified user. |
| `getFollowing(userId, limit, offset)` | Retrieves users followed by the specified user. |
| `getFollowCounts(userId)` | Returns follower and following counts. |

## 3. Validation

The service validates user IDs as UUIDs.

Pagination is validated using these limits:

- Default page size: 50.
- Minimum page size: 1.
- Maximum page size: 100.
- Minimum offset: 0.
- Maximum offset: 100,000.

Invalid IDs and pagination values produce application errors rather than being passed directly into database queries.

## 4. Authorization and access rules

### Account status

- The acting user must have an active account to follow someone.
- The target user must also have an active account.
- Inactive or unavailable targets are treated as not found when following.
- Follow-list and count queries require the requested user's account to be active.

The service does not independently authenticate a request. Controllers must obtain the authenticated user from the verified Supabase session and supply the appropriate user ID.

### Blocking

A block in either direction prevents a new follow.

The service also:
- Returns `false` from `isFollowing` when either user has blocked the other.
- Excludes blocked relationships from follower lists.
- Excludes blocked relationships from following lists.
- Excludes blocked relationships from follower and following counts.

Unfollowing deliberately remains available even when an account is inactive or a block exists. This allows an existing relationship to be removed after restrictions are introduced.

## 5. Follow operation

`followUser` performs these checks:

1. Validate both user IDs.
2. Prevent users from following themselves.
3. Verify that the acting account is active.
4. Verify that the target account is active.
5. Check for a block in either direction.
6. Check whether the relationship already exists.
7. Insert the relationship if it does not exist.

The insert uses `onConflictDoNothing` against the follower/following pair.

If another request creates the relationship concurrently, the service retrieves and returns the existing relationship instead of treating the duplicate as a failure.

## 6. Unfollow operation

`unfollowUser` deletes the relationship matching the supplied follower and target IDs.

It returns:

- `unfollowed`: whether a relationship was deleted.
- `relationship`: the deleted relationship details, or `null` if no relationship existed.

The operation is safe to repeat. An absent relationship does not produce an error.

## 7. Relationship lookup

`isFollowing`:

1. Validates both IDs.
2. Checks that the acting user is active.
3. Checks that the target account is active.
4. Checks for a block in either direction.
5. Looks for the follow relationship.

It returns a boolean.

A relationship hidden by a block is reported as `false`, even if its database record has not yet been removed.

## 8. Followers and following lists

Both list functions return:

- User ID
- Username
- Display name
- Avatar URL
- Follow creation timestamp (`followedAt`)

They:
- Exclude inactive profiles.
- Exclude users blocked in either direction.
- Sort by newest relationship first.
- Apply validated limit and offset pagination.

`getFollowers` retrieves the people following the specified user.

`getFollowing` retrieves the people the specified user follows.

## 9. Follow counts

`getFollowCounts` returns:

```typescript
{
  followers: number;
  following: number;
}
```

Both counts exclude relationships involving inactive profiles and relationships blocked in either direction.

Database count results are converted to JavaScript numbers before being returned.

## 10. Dependencies

| Dependency | Purpose |
|---|---|
| Drizzle ORM | Database queries and relationship operations. |
| `follows` table | Stores follow relationships. |
| `profiles` table | Provides profile information and account status. |
| `blocks` table | Enforces block-aware follow behavior. |
| `AppError` | Provides consistent application errors. |
| Zod | Validates IDs and pagination input. |
| `server-only` | Prevents accidental client-side imports. |

## 11. Important implementation boundaries

The service does not currently:

- Enforce profile discoverability settings.
- Send follow notifications.
- Restore follow relationships after an unblock.
- Automatically clean up existing follow records when a block is created.
- Authenticate users or derive IDs from a session.
- Enforce a database-level transaction or lock across the follow and block checks.

The Blocks Service must handle follow cleanup when a user blocks another user. Unblocking must not automatically restore deleted relationships.

A future concurrency review should consider the race between creating a follow and creating a block. The current checks protect normal requests but do not establish a database-level invariant against simultaneous operations.

## 12. Future integration points

When controllers are introduced:

- Derive `followerId` from the verified Supabase session, never from an untrusted request body.
- Validate target IDs at the controller boundary as well as in the service.
- Trigger notifications after a successful new follow, not when an existing relationship is returned.
- Ensure the Blocks Service removes follow relationships in both directions when a block is created.
- Apply the platform's discoverability policy when that policy is formally defined.

## 13. Verification

The corrected service passed:

```powershell
npx tsc --noEmit
```

This confirms TypeScript compatibility. It does not replace runtime tests for follow creation, duplicate requests, blocking, account suspension, pagination, or concurrent operations.
