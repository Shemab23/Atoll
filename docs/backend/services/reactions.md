# Reactions Service

**Source file:** `src/server/services/reactions.service.ts`
**Domain:** Post reactions
**Status:** Corrected; TypeScript check passed

## 1. Purpose

The Reactions Service manages user reactions to posts.

It supports:
- Adding a reaction to a post.
- Changing an existing reaction.
- Removing the current user's reaction.
- Retrieving reaction counts grouped by reaction type.
- Retrieving the current user's reaction on a post.

The service uses Drizzle ORM for database operations and Zod for input validation.

## 2. Main Functions

| Function | Responsibility |
|---|---|
| `setReaction(userId, postId, input)` | Creates a reaction or changes the user's existing reaction. |
| `removeReaction(userId, postId)` | Removes the current user's reaction from a post. |
| `getPostReactionCounts(viewerId, postId)` | Returns reaction totals grouped by reaction type. |
| `getUserReaction(userId, postId)` | Retrieves the current user's reaction on a post. |

## 3. Validation

The service validates:
- User IDs as UUIDs.
- Post IDs as UUIDs.
- Reaction input as a strict object.
- Reaction type as a trimmed string between 1 and 30 characters.

Reaction types must begin with a letter and may contain letters, numbers, underscores, and hyphens.

The final supported reaction list has not yet been defined. The current validation deliberately remains flexible.

## 4. Post Access Rules

Before creating or retrieving reactions, the service checks whether the viewer can access the post.

Access is allowed when:
- The viewer is the post author.
- The post is public.
- The viewer follows the author of a followers-only post.

The post must have active status, and both the viewer and post author must have active accounts.

A block between the viewer and post author prevents access, including for public posts.

## 5. Block Enforcement

The service checks both block directions:

- Viewer has blocked the post author.
- Post author has blocked the viewer.

Either condition prevents reaction creation and reaction retrieval.

The check uses the `blocks` table.

Existing reactions are not automatically deleted when a block is created. Cleanup is the responsibility of the Blocks Service.

## 6. Reaction Creation and Updates

`setReaction` uses an upsert operation.

The database conflict target is the combination of:
- `postId`
- `userId`

If the user has no reaction, a new record is created.

If a reaction already exists, its `reactionType` and `createdAt` are updated.

This allows one reaction per user per post, assuming the database unique constraint is correctly defined.

## 7. Reaction Removal

`removeReaction` deletes only the reaction belonging to the specified user and post.

It does not require the user to retain access to the post.

This is intentional: users should be able to remove their own previous reaction even if post visibility changes or a block is introduced later.

The operation returns:
- `removed`: whether a reaction was deleted.
- `reaction`: the deleted reaction's ID and post ID, or `null`.

The user's account must still be active.

## 8. Reaction Counts

`getPostReactionCounts` groups reactions by `reactionType` and returns numeric totals.

Example response:

```json
[
  {
    "reactionType": "like",
    "total": 12
  },
  {
    "reactionType": "love",
    "total": 4
  }
]
```

The viewer must have access to the post before counts are returned.

## 9. Database Interaction

The service uses:
- `reactions`
- `posts`
- `profiles`
- `follows`
- `blocks`

Drizzle ORM operations include:
- `select`
- `insert`
- `delete`
- `onConflictDoUpdate`
- `groupBy`
- `count`

The file imports `server-only` to prevent accidental client-side use.

## 10. Error Handling

| Error code | Situation |
|---|---|
| `INVALID_REACTION_IDENTIFIER` | User ID, viewer ID, or post ID is not a valid UUID. |
| `INVALID_REACTION` | Reaction input does not meet validation rules. |
| `ACCOUNT_NOT_ACTIVE` | Viewer or post author does not have an active account. |
| `POST_NOT_FOUND` | Post does not exist or is not active. |
| `POST_ACCESS_DENIED` | Viewer cannot access a followers-only post. |
| `INTERACTION_BLOCKED` | A block exists between viewer and post author. |
| `REACTION_SAVE_FAILED` | The database did not return a saved reaction. |

Unexpected database errors propagate to centralized error handling.

## 11. Important Limitations

- Reaction types are not yet restricted to a final product-defined list.
- The service checks block relationships but does not clean up existing reactions when a block is created.
- Account and post access checks are performed before reaction operations; the API controller must still authenticate the request and derive the user ID from the verified session.
- The service does not implement notification creation when someone reacts to a post.
- The service does not implement feed-level post visibility; it checks access to a specific post.

## 12. Future Integration Requirements

Before API controllers are implemented:

1. Define the supported reaction types.
2. Confirm the unique database constraint on `(postId, userId)`.
3. Integrate reaction cleanup into the Blocks Service.
4. Decide whether reactions should generate notifications.
5. Ensure API controllers use the authenticated session ID rather than request-supplied user IDs.
6. Apply shared account-status and authorization policies consistently across services.

## 13. Verification

The corrected service passed:

```powershell
npx tsc --noEmit
```

This verifies TypeScript compilation. It does not independently verify database behavior, authorization, or runtime functionality.
