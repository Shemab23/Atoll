# Posts Service

**Source file:** `src/server/services/posts.service.ts`
**Domain:** User posts and attached media
**Status:** Corrected; TypeScript check passed

## 1. Purpose

The Posts Service manages posts created by users.

It supports:
- Creating text, image, and mixed posts.
- Attaching media records to posts.
- Retrieving an individual post owned by the authenticated user.
- Retrieving a paginated list of the user's posts.
- Updating post content and visibility.
- Soft-deleting posts.

The service uses Drizzle ORM and Zod validation. Authentication and ownership identity must be enforced by trusted server-side code.

## 2. Main Functions

| Function | Responsibility |
|---|---|
| `createPost(authorId, input)` | Creates a post and its media records in a database transaction. |
| `getOwnPost(authorId, postId)` | Retrieves one active post belonging to the specified author, including media. |
| `getOwnPosts(authorId, options)` | Retrieves the author's active posts with pagination and attached media. |
| `updatePost(authorId, postId, input)` | Updates post content or visibility after checking ownership and the resulting content state. |
| `deletePost(authorId, postId)` | Soft-deletes an active post belonging to the author. |

## 3. Post Types and Validation

The service supports three post types:

| Type | Required content | Media |
|---|---|---|
| `text` | Non-empty text | Not allowed |
| `image` | No text | At least one media item |
| `mixed` | Non-empty text | At least one media item |

Additional rules:
- Content has a maximum length of 5,000 characters.
- Visibility is either `public` or `followers`.
- A post can contain a maximum of 10 media items.
- Media display order must be unique within a post.
- Display order must be an integer between 0 and 100.
- Supported media MIME types are JPEG, PNG, WebP, and GIF.
- Unknown input properties are rejected.

## 4. Media Handling

Each media item contains:
- `storagePath`
- `mediaType`
- `displayOrder`

The current service expects the storage path to begin with the author's UUID followed by `/`.

Example:

`USER_UUID/image.webp`

The service rejects:
- Paths that do not belong to the author according to this convention.
- Absolute paths.
- Paths containing directory traversal segments.
- Backslash-based paths.
- Unsupported media types.

Media records are inserted in the same transaction as the post. If the database transaction fails, the post and its media records are rolled back together.

**Important limitation:** This service does not verify that the referenced file actually exists in Supabase Storage or that the file's real content matches its declared MIME type. Those checks must be implemented in the upload workflow.

## 5. Ownership and Authorization

The service validates author and post IDs as UUIDs.

Retrieval, update, and deletion queries include the author ID and active post status. This prevents a user from retrieving or modifying another user's post through these owner-specific functions.

API controllers must:
1. Authenticate the request.
2. Obtain the author ID from the verified session.
3. Never trust an author ID supplied by the request body.
4. Enforce active-account and platform-wide block policies.

The database connection uses privileged access, so these service queries must not rely on RLS to enforce ownership.

## 6. Pagination

`getOwnPosts` supports:
- Default limit: 20 posts.
- Maximum limit: 50 posts.
- Default offset: 0.
- Maximum offset: 100,000.

Invalid pagination options are rejected.

The service retrieves media for the selected posts in a separate query and groups the media records by post ID before returning the result.

Offset pagination is sufficient for the current implementation. Cursor pagination can be considered later if the post collection becomes large.

## 7. Updating Posts

The update operation currently allows:
- Changing content.
- Changing visibility.

It does not allow changing:
- Post type.
- Attached media.
- Author ID.
- Post status.

The service checks the resulting content against the existing post type. For example, an image post cannot be changed to contain text while remaining an image post.

## 8. Deletion

Posts are soft-deleted by setting their status to `deleted`.

The database record and media records are not physically removed by this operation.

A deleted post cannot be retrieved, updated, or deleted again through the active-post queries.

Media retention and eventual storage cleanup require a separate policy.

## 9. Database Interaction

The service uses:
- `posts` for post records.
- `postMedia` for attached media records.

Drizzle ORM operations include:
- `insert`
- `select`
- `update`
- `returning`
- `transaction`
- `inArray`

The service imports `server-only` to prevent accidental use from client-side code.

## 10. Error Handling

| Error code | Situation |
|---|---|
| `INVALID_POST_IDENTIFIER` | Author ID or post ID is not a valid UUID. |
| `INVALID_POST_INPUT` | Post creation or update input is invalid. |
| `INVALID_POST_CONTENT` | The resulting content does not match the post type. |
| `INVALID_MEDIA_OWNERSHIP` | A media path does not follow the author's storage-path convention. |
| `INVALID_POST_PAGINATION` | Pagination options are invalid. |
| `POST_NOT_FOUND` | The post does not exist, is inactive, or does not belong to the specified author. |
| `POST_CREATION_FAILED` | The database did not return a created post record. |

Unexpected database errors are allowed to propagate to centralized error handling.

## 11. Future Integration Requirements

Before API controllers are implemented:

1. Ensure the media upload process uses the same author-prefixed Storage path convention.
2. Verify media ownership and file existence against Supabase Storage.
3. Verify actual file content and MIME type during upload.
4. Enforce account-status and block rules.
5. Define media retention and cleanup after post deletion.
6. Add feed retrieval separately, with public/follower visibility enforcement.
7. Consider cursor pagination if offset pagination becomes inefficient.

## 12. Verification

The corrected service passed:

```powershell
npx tsc --noEmit
```

This verifies TypeScript compilation. It does not by itself verify database behavior, Storage ownership, authorization, or runtime functionality.
