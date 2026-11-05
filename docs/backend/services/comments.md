# Comments Service

**Source:** `src/server/services/comments.service.ts`
**Status:** Corrected; TypeScript check passed
**Database tables:** `comments`, `posts`, `profiles`, `follows`, `blocks`

## 1. Purpose

The Comments Service manages comments and replies on posts.

It supports:
- Creating comments.
- Replying to existing comments.
- Retrieving comments for a post.
- Editing an existing comment.
- Soft-deleting an owned comment.

The service enforces post visibility, account status, and blocking rules before allowing comment interactions.

## 2. Exported functions

| Function | Responsibility |
|---|---|
| `createComment(authorId, postId, input)` | Creates a comment or a one-level reply. |
| `getPostComments(viewerId, postId, limit, offset)` | Retrieves accessible comments for a post. |
| `updateComment(authorId, commentId, input)` | Updates the author's own active comment. |
| `deleteComment(authorId, commentId)` | Soft-deletes the author's own active comment. |

## 3. Validation

### Create comment input

```typescript
{
  content: string;
  parentId?: string | null;
}
```

Rules:
- Content is trimmed.
- Content must contain at least one character.
- Maximum content length is 5,000 characters.
- `parentId`, when provided, must be a UUID.
- Unknown properties are rejected.

### Update comment input

```typescript
{
  content: string;
}
```

The same content rules apply.

### IDs and pagination

All user, post, and comment IDs are validated as UUIDs.

Comment retrieval uses:
- Default page size: 50.
- Minimum page size: 1.
- Maximum page size: 100.
- Minimum offset: 0.
- Maximum offset: 100,000.

## 4. Account and post access rules

### Account status

Creating and retrieving comments requires the acting user to have an active account.

The post author must also have an active account for the post to be accessible through this service.

Updating a comment requires the comment author to have an active account.

Deleting a comment deliberately does not require an active account. This allows the owner to remove their own content after their account becomes inactive.

### Post visibility

Before creating or retrieving comments, the service checks that the post exists and is active.

Access rules:

- The post author can access their own post.
- Other users can access public posts.
- Followers-only posts require an existing follow relationship.
- Users blocked in either direction cannot interact with the post through this service.

An inaccessible or inactive post is treated as not found or access denied, depending on the condition.

## 5. Creating comments and replies

`createComment`:

1. Validates the author and post IDs.
2. Validates the comment input.
3. Checks that the author can access the post.
4. If a parent ID is supplied, verifies that the parent comment:
   - Exists.
   - Belongs to the same post.
   - Is active.
5. Prevents replies to existing replies.
6. Checks that the parent author is active.
7. Checks for a block between the commenter and parent author.
8. Inserts the new comment.

### Reply depth

The service permits only one reply level:

- A top-level comment can receive replies.
- A reply cannot receive another reply.

This keeps the comment structure simple and avoids deeply nested discussion threads.

## 6. Retrieving comments

`getPostComments` first checks whether the viewer can access the post.

It returns active comments belonging to that post, subject to these filters:

- The comment author must have an active account.
- The viewer and comment author must not have blocked each other.
- The comments must belong to the requested post.

Results are ordered by creation time, oldest first, and use validated limit/offset pagination.

The query returns the comment records, including their parent IDs, so the application can organize top-level comments and replies.

## 7. Updating comments

`updateComment`:

1. Validates the author and comment IDs.
2. Requires the author account to be active.
3. Validates the replacement content.
4. Updates only a comment matching:
   - The requested comment ID.
   - The supplied author ID.
   - Active comment status.

If no matching comment exists, it returns `COMMENT_NOT_FOUND`.

Only the comment's owner can update it through this function.

## 8. Deleting comments

`deleteComment` performs a soft deletion.

It changes the comment status from `active` to `deleted`, provided that:

- The comment ID is valid.
- The author ID is valid.
- The comment belongs to that author.
- The comment is currently active.

The record is not physically removed from the database.

The function returns the deleted comment's ID and new status.

## 9. Dependencies

| Dependency | Purpose |
|---|---|
| Drizzle ORM | Database queries. |
| `comments` table | Stores comments and replies. |
| `posts` table | Checks post status, ownership, and visibility. |
| `profiles` table | Checks account status and comment authors. |
| `follows` table | Checks access to followers-only posts. |
| `blocks` table | Enforces block-aware interactions and retrieval. |
| `AppError` | Consistent application errors. |
| Zod | Validates inputs, IDs, and pagination. |
| `server-only` | Prevents accidental client-side imports. |

## 10. Important implementation boundaries

The service does not currently:

- Send comment or reply notifications.
- Implement moderation review or automated content filtering.
- Allow administrators or moderators to delete comments through these functions.
- Return a deleted-parent placeholder when active replies exist.
- Implement cursor-based pagination.
- Enforce a database-level concurrency guarantee against a block being created simultaneously with a comment.
- Authenticate the acting user itself.

The current retrieval query filters comments from blocked and inactive authors. A deleted parent comment is omitted, even if it has active replies. The frontend presentation policy for that case remains undecided.

## 11. Future integration points

When controllers are introduced:

- Derive author and viewer IDs from verified Supabase sessions.
- Never trust client-supplied author IDs.
- Trigger notifications after successful comment creation.
- Keep notification failures from undoing an otherwise successful comment.
- Integrate report and moderation workflows.
- Decide how the interface should represent active replies whose parent comment was deleted.
- Consider cursor pagination if comment volume makes offset pagination inefficient.

## 12. Verification

The corrected service passed:

```powershell
npx tsc --noEmit
```

This confirms TypeScript compatibility. Runtime tests are still needed for post visibility, block filtering, reply depth, inactive accounts, editing ownership, and soft deletion.
