# Conversations Service

**File:** `src/server/services/conversations.service.ts`
**Status:** Corrected; TypeScript check passed

## 1. Purpose

The Conversations Service manages direct and group conversations, including membership changes and read status.

It is responsible for:
- Creating direct conversations between two users.
- Creating group conversations.
- Adding and removing conversation members.
- Retrieving a user's conversations.
- Marking conversations as read.
- Enforcing account-status, membership, and block restrictions.

## 2. Exported functions

| Function | Responsibility |
|---|---|
| `isConversationMember` | Checks whether a user is an active member of a conversation. |
| `createDirectConversation` | Creates a direct conversation between two users. |
| `createGroupConversation` | Creates a group conversation with the creator and invited participants. |
| `addConversationMember` | Adds or reactivates a member in a group conversation. |
| `removeConversationMember` | Allows a member to leave or a group creator to remove another member. |
| `getUserConversations` | Retrieves conversations in which a user has active membership. |
| `markConversationAsRead` | Updates the read status for an active conversation member. |

## 3. Validation and access rules

### User and conversation IDs
- IDs are validated as UUIDs.
- Operations requiring an active account check account status.
- Users must have active membership for membership-restricted operations.

### Direct conversations
- A direct conversation has exactly two active members.
- Both participants must have active accounts.
- A user cannot start a direct conversation with themselves.
- A block in either direction prevents direct conversation creation.
- Conversation creation and membership insertion happen inside a database transaction.

### Group conversations
- The creator is included as a member.
- Duplicate participant IDs are removed.
- The creator is excluded from the invitee list if included.
- At least one other participant is required.
- Maximum group size is 50 members, including the creator.
- Participants must have active accounts.
- A block between any two participants prevents group creation.

### Adding members
- Only an active group member can add another member.
- The target must have an active account.
- A user cannot add themselves.
- The group must remain within the 50-member limit.
- Block relationships between the target and existing active members prevent the addition.
- Existing inactive memberships can be reactivated.
- Membership changes and conversation timestamp updates happen transactionally.

### Removing members
- A member can leave a conversation themselves.
- Only the active group creator can remove another member.
- A direct-conversation member cannot remove the other participant.
- Membership is deactivated rather than physically deleted.
- The conversation timestamp is updated transactionally.
- The group creator is currently allowed to leave their own group.

### Retrieving conversations
- The requested user must have an active account.
- Only conversations with active membership are returned.

### Read status
- The user must have an active account.
- Only the user's own active membership record is updated.

## 4. Authorization responsibilities

The service performs important business-level checks, but it does not establish the identity of the requester.

The future API controller must:
1. Authenticate the request using the Supabase session.
2. Obtain the user ID from the authenticated session.
3. Pass that trusted ID to the service.
4. Never trust a client-submitted user ID as proof of identity.

The service must remain independent of Next.js request and response objects.

## 5. Transactions

Database transactions are used for:
- Direct conversation creation and member insertion.
- Group conversation creation and initial membership insertion.
- Adding or reactivating a group member.
- Removing a member and updating the conversation timestamp.

This helps prevent partially completed membership operations.

## 6. Known limitations and future work

| Area | Current limitation / future requirement |
|---|---|
| Concurrent direct creation | Simultaneous requests can potentially create duplicate direct conversations. A database-level uniqueness or locking strategy is still needed. |
| Group ownership | There is no ownership-transfer mechanism. The creator can leave, but ownership transfer is not implemented. |
| Block race conditions | A block can potentially be created concurrently with a membership operation. Stronger database-level coordination may be needed. |
| Messaging access | The Messages Service must independently verify active conversation membership and apply block/account rules. |
| Notifications | Membership and conversation events are not yet connected to notification creation. |
| Realtime | Live conversation updates and message delivery are handled separately through Supabase Realtime. |

## 7. Dependencies

- `server-only`
- Drizzle ORM
- Zod
- Application database connection
- Conversation and conversation-members schema
- Profiles schema
- Blocks schema
- Application `AppError`

## 8. Security notes

- Do not expose this service to client-side imports.
- Do not expose privileged database credentials.
- Do not assume database queries automatically enforce authorization.
- Controllers must derive the acting user from the authenticated session.
- Other services, especially Messages, must enforce their own membership and access rules.

## 9. Summary

The Conversations Service provides the foundation for direct and group conversations. It handles membership lifecycle operations and enforces core account, block, and group-size rules. It is ready for controller integration after the remaining backend services have been audited and documented.
