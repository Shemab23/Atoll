# Messages Service

**File:** `src/server/services/messages.service.ts`
**Status:** Corrected; TypeScript check passed

## 1. Purpose

The Messages Service manages messages exchanged inside direct and group conversations.

It is responsible for:
- Sending text and image messages.
- Retrieving conversation message history.
- Retrieving the latest messages.
- Editing text messages.
- Soft-deleting messages.
- Enforcing account, membership, and block restrictions.

## 2. Exported functions

| Function | Responsibility |
|---|---|
| `sendMessage` | Sends a text or image message to a conversation. |
| `getConversationMessages` | Retrieves messages chronologically using limit and offset pagination. |
| `getLatestConversationMessages` | Retrieves the newest messages and returns them chronologically. |
| `updateMessage` | Edits the content of an owned text message. |
| `deleteMessage` | Soft-deletes an owned message. |

## 3. Validation rules

### Identifiers
- User IDs, conversation IDs, and message IDs are validated as UUIDs.
- Invalid identifiers produce an application validation error.

### Text messages
- Content is trimmed.
- Maximum content length is 5,000 characters.
- Empty text messages are rejected.
- Text messages cannot contain an image media path.

### Image messages
- An image message requires a media path.
- Media paths are limited to 1,000 characters.
- The path must begin with the sender's user ID.
- Absolute paths, backslashes, empty path segments, and `.` or `..` segments are rejected.

The media-path check enforces the application's ownership convention. It does not verify the actual file in Supabase Storage.

### Pagination
- Default page size: 50.
- Maximum page size: 100.
- Offset must be an integer between 0 and 100,000.
- Latest-message retrieval also accepts a bounded integer limit between 1 and 100.

## 4. Authorization and access rules

### Account status
- Sending, retrieving, and editing messages require an active account.
- Inactive or suspended accounts cannot perform those operations.

### Conversation membership
- The user must have an active membership record.
- Inactive or removed members cannot send or retrieve messages.

### Blocking
- Sending, retrieving, and editing messages are prevented when a blocking relationship exists between the requesting user and another active conversation member.
- Blocking is checked in both directions.
- Deleting an owned message does not require the absence of a blocking relationship.

### Message ownership
- Only the sender can edit their message.
- Only the sender can delete their message.
- Only active, non-deleted text messages can be edited.
- Image messages cannot be edited through the text-edit operation.

## 5. Message lifecycle

### Sending
1. Validate sender and conversation IDs.
2. Validate message input.
3. Check account status and active conversation membership.
4. Check blocking relationships.
5. Validate image media path when applicable.
6. Insert the message.
7. Update the conversation's `updatedAt` timestamp.

Message insertion and conversation timestamp updating happen inside a database transaction.

### Retrieving
- Deleted messages are excluded.
- Chronological retrieval orders by creation timestamp and message ID.
- Latest-message retrieval queries newest first, then reverses the returned records for chronological display.

### Editing
- The message must exist, be owned by the requester, and not be deleted.
- Only text messages are editable.
- The content and `editedAt` timestamp are updated.

### Deleting
- The message must exist, be owned by the requester, and not be deleted.
- Deletion is a soft delete.
- Content and media path are cleared.
- `deletedAt` is set to the current timestamp.

## 6. Database dependencies

- `messages`
- `conversation_members`
- `conversations`
- `profiles`
- `blocks`

The service uses Drizzle ORM and the application's database connection.

## 7. Known limitations and future work

| Area | Current limitation / future requirement |
|---|---|
| Storage verification | Media paths are checked by naming convention only. Verify actual file ownership, existence, and MIME type through Supabase Storage. |
| Pagination | Offset pagination is currently used. Cursor-based pagination may be preferable as message history grows. |
| Block race conditions | A block can be created concurrently with a message operation. Stronger database coordination may be needed. |
| Membership race conditions | Membership can change concurrently with message operations. Consider transaction-level coordination. |
| Concurrent updates | Ownership and deletion conditions are included in updates, but stronger locking may be needed for fully coordinated message changes. |
| Realtime | Live message delivery and subscriptions are handled separately through Supabase Realtime. |
| Notifications | Message sending is not yet connected to notification creation. |
| Moderation | Message reporting and moderation are handled by separate services. |

## 8. Security notes

- This service is server-only.
- The service does not authenticate the requester itself.
- Future API controllers must obtain the acting user ID from the verified Supabase session.
- Never trust a client-submitted user ID as proof of identity.
- Privileged database credentials must never be exposed to the client.
- Authorization is explicitly enforced because privileged database access does not automatically rely on RLS.

## 9. Summary

The Messages Service provides the core messaging operations for Atoll. It supports text and image messages, message history, editing, and soft deletion while enforcing account status, active membership, ownership, and block rules.

It has passed TypeScript validation and is ready for later controller integration, subject to the documented limitations and remaining backend integration work.
