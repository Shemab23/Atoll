# Atoll Real-Time Architecture

**Project:** Atoll
**Status:** Architecture and implementation requirements
**Technology:** Supabase Realtime
**Scope:** Live messaging, notifications and synchronized application updates

## 1. Purpose

Atoll uses Supabase Realtime to deliver live updates to connected users.

The initial real-time requirements are:

- New messages appear without refreshing the conversation.
- Message edits and deletions are reflected in connected clients.
- Conversation updates are reflected in the user's conversation list.
- Conversation membership changes are synchronized.
- Read-state changes are reflected where needed.
- New notifications appear without refreshing the application.
- Notification read-state changes are synchronized.

PostgreSQL remains the persistent source of truth. Realtime is the delivery mechanism for changes, not a replacement for database storage.

## 2. Technology Choice

Atoll will use Supabase Realtime rather than building a separate WebSocket server.

Responsibilities:

| Technology | Responsibility |
|---|---|
| PostgreSQL | Persistent application data |
| Drizzle ORM | Server-side database operations |
| Next.js API | Authenticated application commands |
| Supabase Realtime | Live change delivery |
| Supabase Auth | User identity and sessions |
| Frontend | Subscription management and interface updates |

This keeps the architecture within the existing Supabase and Next.js stack.

## 3. General Architecture

The intended flow is:

1. A client performs an action through a Next.js API endpoint.
2. The API identifies the authenticated user.
3. The relevant service validates permissions and business rules.
4. Drizzle writes the change to PostgreSQL.
5. Supabase Realtime delivers the configured database event.
6. Authorized clients receive the event.
7. The frontend updates the relevant interface.

The database write must succeed before the client treats the action as successful.

Realtime events must not be used as proof that a user was authorized to perform an operation.

## 4. Real-Time Messaging

### 4.1 Sending messages

The intended flow:

1. The sender submits a message through the backend API.
2. The backend verifies the sender's identity.
3. The message service checks active conversation membership.
4. The service checks applicable account and block restrictions.
5. The message is inserted into PostgreSQL.
6. Supabase Realtime publishes the configured change.
7. Other authorized conversation members receive the new message.
8. The sender and recipients display the persisted message.

Messages must be stored before they are delivered through Realtime.

### 4.2 Receiving messages

Clients should subscribe only to conversations they are currently authorized to access.

A user must not receive private messages from conversations they do not belong to.

The frontend should:

- Load message history through the backend.
- Subscribe to new message events.
- Update the conversation when a valid event arrives.
- Handle duplicate events safely.
- Reconcile the interface with persisted data when reconnecting.

### 4.3 Message edits

When a message is edited:

1. The backend verifies message ownership.
2. The service validates the new content.
3. The database is updated.
4. An authorized event is delivered.
5. Connected clients update the existing message.

### 4.4 Message deletions

When a message is deleted:

1. The backend verifies ownership or an authorized moderation action.
2. The database is updated according to the deletion policy.
3. The change is delivered to authorized clients.
4. Clients update the message display.

User deletion and administrative moderation hiding should eventually have distinguishable behavior.

## 5. Conversation Updates

Realtime functionality must support conversation-related changes.

Relevant changes include:

- New messages.
- Conversation activity timestamps.
- Membership additions.
- Membership removals.
- Read-state updates.

The conversation list should update when a new message arrives, without requiring a full application refresh.

Only active conversation members should receive the corresponding private conversation updates.

## 6. Read-State Synchronization

The `conversationMembers` table contains `lastReadAt`.

When a user opens or reads a conversation:

1. The frontend calls the backend read-state operation.
2. The backend verifies active membership.
3. The service updates `lastReadAt`.
4. The change is persisted.
5. Other authorized clients can receive the configured update.

Read-state information must not be exposed to users who are not members of the conversation.

## 7. Real-Time Notifications

Notifications are stored in the `notifications` table.

The intended flow:

1. A trusted backend workflow performs an application action.
2. The workflow creates a notification for the appropriate recipient.
3. The notification is stored in PostgreSQL.
4. Supabase Realtime publishes the configured change.
5. The recipient receives the event.
6. The frontend updates the notification list and unread count.

Examples of possible notification-triggering actions include:

- A new follower.
- A reaction to a post.
- A comment on a post.
- A supported conversation event.

Notification generation must respect notification preferences and supported notification categories.

A notification must never be created by trusting arbitrary recipient information submitted by an untrusted client.

### 7.1 Read-state updates

When a recipient marks a notification as read:

1. The backend verifies ownership.
2. The notification is updated.
3. The change is persisted.
4. The frontend updates the notification state and unread count.

## 8. Authorization and Security

Realtime subscriptions must follow the authorization rules defined in `authorization-rules.md`.

Important requirements:

1. A user may receive private conversation events only when they are an authorized active member.
2. A user may receive private notification events only for their own notifications.
3. Removed conversation members must lose access to future private events.
4. Block relationships must be considered where they affect access.
5. Suspended or deleted accounts must not retain normal application access.
6. Clients must not be able to subscribe to arbitrary private database records.
7. Realtime authorization must be enforced server-side through the supported Supabase mechanisms.

The use of Drizzle with a privileged PostgreSQL connection means that service-level authorization remains mandatory. Database Row Level Security must not be assumed to protect privileged service queries.

## 9. Reconnection and Data Consistency

Realtime delivery is not a substitute for reliable database reads.

Clients may disconnect, lose network access or miss events.

Therefore:

- PostgreSQL remains the source of truth.
- Message history must be retrievable through the backend.
- The client must resynchronize after reconnecting.
- Duplicate events must not create duplicate messages in the interface.
- Events should be reconciled using stable database record IDs.
- The interface should handle temporary connection failures gracefully.

The initial implementation should prioritize correctness and recovery over complex offline synchronization.

## 10. Performance and Resource Management

The frontend should avoid creating unnecessary subscriptions.

Requirements:

- Subscribe only to the data currently needed.
- Remove subscriptions when leaving a conversation or screen.
- Avoid opening duplicate subscriptions for the same resource.
- Use database queries for historical data rather than replaying large event histories.
- Keep event payloads limited to the information needed by the client.
- Avoid exposing sensitive fields through Realtime payloads.

## 11. Implementation Requirements

Before enabling production Realtime functionality, verify:

1. Required tables and events are configured for publication.
2. Private-channel or database-change authorization is correctly configured.
3. Conversation membership changes affect subscription access.
4. Notification events are recipient-specific.
5. Browser clients use the correct Supabase session.
6. Unauthorized users cannot receive private events.
7. Reconnection and duplicate-event handling work.
8. Message persistence remains correct when Realtime is unavailable.

The exact subscription mechanism and configuration must be selected and tested against the deployed Supabase project.

## 12. Testing Requirements

### Messaging tests

- Send a message from one account.
- Confirm it appears in another active member's conversation without refreshing.
- Confirm a non-member cannot receive the event.
- Confirm a removed member cannot receive future private events.
- Edit a message and verify the update appears.
- Delete a message and verify the expected display behavior.
- Disconnect and reconnect, then verify history is consistent.

### Notification tests

- Trigger a notification through a trusted backend action.
- Confirm only the recipient receives it.
- Confirm the unread count changes.
- Mark it as read.
- Confirm the read state is consistent after refreshing.

### Security tests

- Attempt to subscribe to another user's notifications.
- Attempt to subscribe to an unrelated conversation.
- Attempt access after account suspension.
- Verify that block restrictions are respected.
- Verify that private message and notification data are not exposed.

## 13. Implementation Status

The project has selected Supabase Realtime as its real-time technology.

The messaging and notification services have been audited, but their real-time integration is not yet verified.

The following work remains:

- Configure the required database publication or private-channel authorization.
- Define authorized subscription patterns.
- Implement frontend subscription lifecycle management.
- Verify membership-based access.
- Verify recipient-based notification access.
- Implement reconnect and duplicate-event handling.
- Test all real-time behavior with multiple accounts.

Do not consider real-time functionality complete until the security and functional tests above pass.

---

**Document:** `realtime.md`
**Project:** Atoll
