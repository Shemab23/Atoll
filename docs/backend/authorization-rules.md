# Atoll Authorization Rules

**Project:** Atoll
**Status:** Proposed shared authorization rules
**Scope:** Authentication, account access, ownership, content visibility, social interactions and administration

## 1. Purpose

This document defines who can access Atoll resources and perform actions.

Authorization must be enforced on the server. Hiding a button or restricting a frontend screen is not sufficient security.

These rules apply to API Route Handlers and backend services.

## 2. Authentication and Identity

Supabase Auth is the source of user identity.

### Rules

1. Every protected API operation must identify the authenticated user through the server-side Supabase client.
2. The backend must use the verified Supabase user ID as the actor ID.
3. A user ID supplied in a request body must never be trusted as proof of identity.
4. Public endpoints may be accessible without authentication where the feature allows it.
5. Services must receive the authenticated actor ID from trusted server-side code.
6. Missing or invalid authentication must result in an appropriate unauthorized response.

The `profiles.id` value corresponds to the authenticated Supabase user ID.

## 3. Account Status

The profile account status currently supports:

- `active`
- `suspended`
- `deleted`

### Rules

| Account status | Expected access |
|---|---|
| Active | Normal permitted application access |
| Suspended | Restricted access |
| Deleted | No normal application access |

A suspended account must not be able to perform normal social interactions, including posting, commenting, reacting, following or sending messages.

A deleted account must not be treated as an ordinary active user.

The exact permitted account-recovery and appeal operations must be defined separately.

### Important implementation requirement

Account-status enforcement must be consistent across services. It must not depend on individual services remembering to implement their own slightly different checks.

## 4. Profile Access

Profiles contain both public-facing and private information.

### Rules

1. A user can access their own profile information according to the application's account rules.
2. Other users may access public profile information.
3. Private fields must not be exposed through public profile responses.
4. Profile discoverability must be respected by discovery features.
5. Knowing a username or profile ID must not automatically grant access to private information.
6. Profile updates must be restricted to the profile owner, except for authorized administrative actions.

### Profile settings

The profile settings include:

- Discoverability.
- Online-status visibility.
- Message permissions.
- Notification preferences.

These settings must be respected by the relevant application features.

## 5. Post Visibility

Atoll currently supports two post visibility values:

- `public`
- `followers`

### Rules

| Post visibility | Who can access it? |
|---|---|
| Public | Users who are otherwise permitted to access the content |
| Followers | The post author and users who follow the author, subject to other restrictions |

A post must also have an accessible status.

| Post status | Normal display |
|---|---|
| Active | Eligible for display |
| Hidden | Not displayed normally |
| Deleted | Not displayed normally |

The post owner may manage their own posts.

Other users must not update or delete another user's post unless an authorized administrative action permits it.

## 6. Comments and Reactions

### Comments

1. A user may comment only when they can access the associated post.
2. A user may edit or delete only their own comments.
3. Hidden or deleted content must not be treated as normally accessible.
4. Moderation actions must be able to hide inappropriate comments.
5. Reporting content must remain possible under the reporting rules in this document.

### Reactions

1. A user may react only to a post they can access.
2. A user may remove only their own reaction.
3. A user must not create multiple reactions for the same post if the database supports one reaction per user and post.
4. Block relationships and account restrictions must be enforced before allowing a reaction.

## 7. Follow Relationships

A follow relationship is directional:

- Follower: the user initiating the follow.
- Following: the user receiving the follow.

### Rules

1. Users cannot follow themselves.
2. Users may follow other eligible accounts.
3. A user may remove their own follow relationship.
4. A user must not modify another user's follow relationship.
5. A block relationship in either direction prevents a new follow relationship.
6. Blocking someone must remove existing follow relationships in both directions.
7. Unblocking must not automatically restore removed follow relationships.

Discoverability and follow permission are separate concepts. A decision about whether undiscoverable profiles can still be followed directly must be made before implementing that behavior.

## 8. Blocking

Blocking is a platform-wide safety restriction.

If User A blocks User B:

1. User B must not follow User A.
2. User A must not follow User B.
3. Neither user may initiate a new private message to the other.
4. Existing follow relationships between them must be removed.
5. Normal profile and content discovery must respect the block.
6. Normal social interactions between them must be restricted.
7. The block must not prevent either user from submitting a safety report.
8. Unblocking does not restore previous follows or automatically restore messaging permissions.

Blocking must be enforced in backend services, not only in frontend interfaces.

Existing conversations and messages should be retained. Whether blocked users can still see historical conversations is a separate product-policy decision.

## 9. Conversations and Messaging

A conversation is accessible only to its active members.

### Rules

1. Only active conversation members may retrieve conversation history.
2. Only active conversation members may send messages.
3. A user may leave a conversation.
4. A group creator may manage group membership according to group-conversation rules.
5. A user must not remove another member from a direct conversation.
6. Block relationships must prevent new messages between the affected users.
7. Message editing and deletion must be restricted to the message sender, subject to the application's message policy.
8. A user must not access another user's private conversation through a guessed conversation ID.

### Message media

Media references must be checked to ensure that users cannot attach or access files belonging to other users without permission.

### Real-time access

Supabase Realtime subscriptions must enforce the same conversation-membership restrictions.

A client-side subscription is not authorization by itself.

## 10. Notifications

Notifications belong to their recipient.

### Rules

1. A user may retrieve only their own notifications.
2. A user may mark only their own notifications as read.
3. A user may delete only their own notifications.
4. Notification creation must be performed through trusted backend workflows.
5. A user must not create notifications for arbitrary recipients by submitting an unrestricted API request.
6. Notification preferences must be respected when generating supported notification categories.

Real-time notification delivery must preserve recipient authorization.

## 11. Reports

Reporting is a safety feature.

### Rules

1. Authenticated users may report supported content.
2. The backend must identify the reported user from the actual target content rather than trusting a supplied user ID.
3. Users must not report their own content as another person's content.
4. Reporting must not be blocked by an existing block relationship.
5. Reports must not expose private content to unauthorized users.
6. Report review is restricted to authorized administrative roles.
7. Report status changes must be performed through authorized backend operations.

Reports must remain available as a safety mechanism even when normal social interactions are restricted.

## 12. Administrative Roles

The private `admin_users` table is the source of truth for administrative roles.

Supported roles:

- `owner`
- `admin`
- `moderator`

User-editable metadata must not be trusted to establish administrative permissions.

### Permission matrix

| Capability | Owner | Admin | Moderator |
|---|---:|---:|---:|
| Review reports | Yes | Yes | Yes |
| Issue warnings | Yes | Yes | Yes |
| Hide content | Yes | Yes | Yes |
| Suspend accounts | Yes | Yes | No |
| Permanently ban accounts | Yes | Yes | No |
| Manage administrator roles | Yes | No | No |
| Access administrative role management | Yes | No | No |

The owner is protected from moderation by other administrators.

Administrators cannot moderate other administrative accounts. The owner may moderate other administrative accounts.

All administrative operations must verify the actor's current role on the server.

## 13. Moderation

Moderation actions must be performed by authorized administrators.

Supported actions:

- Warning.
- Hide content.
- Suspend account.
- Ban account.

### Rules

1. A moderator may issue warnings and hide content.
2. An admin may perform all supported moderation actions except actions against protected administrators.
3. The owner has the highest moderation authority.
4. Moderation actions must be recorded in `moderationActions`.
5. The associated report must be updated consistently with the moderation outcome.
6. Temporary suspension must have an expiry mechanism.
7. Permanent bans must not expire automatically.
8. Moderation records must not be editable or removable through ordinary user operations.

## 14. Media Authorization

Supabase Storage is responsible for storing uploaded media.

The backend must ensure:

1. A user cannot attach another user's private media to their content.
2. Uploaded media references follow the application's storage-path convention.
3. Private media is not made publicly accessible without an explicit policy.
4. Media access follows the authorization rules of the associated content.
5. Deleting or hiding content follows the application's media-retention policy.

Storage access policies and application-level authorization must be reviewed together.

## 15. Shared Authorization Helpers

The service layer should eventually use shared authorization helpers for repeated rules.

Examples of required responsibilities:

- Retrieve and validate the current user.
- Require an active account.
- Verify content ownership.
- Verify post visibility.
- Verify active conversation membership.
- Check block relationships.
- Verify administrative permissions.

The exact helper functions and their interfaces will be documented during service correction.

Shared helpers must reduce duplicated logic without weakening feature-specific rules.

## 16. Enforcement Requirements

Authorization must be enforced at the backend boundary and in the service operations that access protected resources.

The frontend must never be considered the final security boundary.

Every protected operation must establish:

- Who is performing the operation.
- Whether the actor's account is permitted to act.
- Which resource is being accessed.
- Whether the actor has permission to access or modify that resource.
- Whether another restriction, such as a block or moderation action, applies.

## 17. Decisions Still Requiring Confirmation

The following policies need a final product decision before implementation:

1. Can users follow undiscoverable profiles directly?
2. Can blocked users see their historical conversations and messages?
3. Can users recover or appeal a suspended or permanently banned account?
4. Should moderators see all moderation history or only relevant records?
5. Should content hiding preserve the original message for moderation review?
6. What happens when a group creator leaves the group?
7. Should deleted profiles and their content be retained, anonymized or permanently removed?

These decisions must be resolved before the affected service behavior is finalized.

---

**Document:** `authorization-rules.md`
**Project:** Atoll
