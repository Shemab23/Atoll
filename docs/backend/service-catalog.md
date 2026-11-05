# Backend Service Catalog

**Project:** Atoll
**Purpose:** Central index of backend services, their responsibilities, exported functions, and audit status.

## 1. Overview

Atoll uses a service-layer architecture.

The service catalog helps developers:
- Find the service responsible for a particular operation.
- Understand what each service exposes.
- Track which services have been audited and typechecked.
- Identify outstanding work before API controllers are introduced.

Services must remain independent of Next.js request and response objects.

## 2. Audited services

The following services have been reviewed, corrected where necessary, and passed `npx tsc --noEmit`.

| Service | File | Responsibility | Exported functions | Status |
|---|---|---|---|---|
| Authentication | `src/server/auth/get-current-user.ts` | Retrieve the currently authenticated Supabase user | `getCurrentUser` | Approved; typecheck passed |
| Profiles | `src/server/services/profiles.service.ts` | Manage public profiles, owner profile data, and profile settings | `getProfileById`, `getOwnProfileById`, `getProfileByUsername`, `updateProfile`, `getProfileSettings`, `updateProfileSettings` | Corrected; typecheck passed |
| Posts | `src/server/services/posts.service.ts` | Create, retrieve, update, and soft-delete user posts and manage attached media records | `createPost`, `getOwnPost`, `getOwnPosts`, `updatePost`, `deletePost` | Corrected; typecheck passed |
| Reactions | `src/server/services/reactions.service.ts` | Create, change, remove, and retrieve reactions while enforcing post access and block rules | `setReaction`, `removeReaction`, `getPostReactionCounts`, `getUserReaction` | Corrected; typecheck passed |
| Follows | `src/server/services/follows.service.ts` | Manage follow relationships, retrieve follower/following lists, and calculate relationship counts | `followUser`, `unfollowUser`, `isFollowing`, `getFollowers`, `getFollowing`, `getFollowCounts` | Corrected; typecheck passed |
| Blocks | `src/server/services/blocks.service.ts` | Manage user blocks, check block relationships, and remove follow relationships when a block is created | `hasBlockBetweenUsers`, `hasUserBlocked`, `blockUser`, `unblockUser`, `getBlockedUsers` | Corrected; typecheck passed |
| Comments | `src/server/services/comments.service.ts` | Create, retrieve, update, and soft-delete comments and replies while enforcing post access, account status, and block rules | `createComment`, `getPostComments`, `updateComment`, `deleteComment` | Corrected; typecheck passed |
| Conversations | `src/server/services/conversations.service.ts` | Create direct and group conversations, manage membership, retrieve user conversations, and update read status | `isConversationMember`, `createDirectConversation`, `createGroupConversation`, `addConversationMember`, `removeConversationMember`, `getUserConversations`, `markConversationAsRead` | Corrected; typecheck passed |
| Messages | `src/server/services/messages.service.ts` | Send, retrieve, update, and delete conversation messages | `sendMessage`, `getConversationMessages`, `getLatestConversationMessages`, `updateMessage`, `deleteMessage` | Corrected; typecheck passed |
| Reports | `src/server/services/reports.service.ts` | Submit reports and manage report records and review status | To be confirmed during audit |Corrected; typecheck passed |
| Notifications | `src/server/services/notifications.service.ts` | Create, retrieve, count, read, and delete notifications | To be confirmed during audit | Corrected; typecheck passed |
| Admin | `src/server/services/admin.service.ts` | Manage administrator permissions and enforce administrative access | `requireAdmin`, `requireOwner`, `requireReportAccess`, `requireModerationPermission`, `getAdminUsers`, grant/revoke operations | Corrected; typecheck passed |
| Moderation | `src/server/services/moderation.service.ts` | Apply moderation actions and retrieve moderation history | `applyModerationAction`, `getModerationActions`, `getUserModerationHistory` | Corrected; typecheck passed |
## 3. Services awaiting audit

> Nothing

*Expected functions are an initial inventory, not a declaration that the services have passed review. Exact exports and behavior will be confirmed from each source file.*

## 4. Audit completion requirements

A service can be marked **Corrected; typecheck passed** only after:

1. Its existing implementation has been reviewed.
2. Validation and authorization responsibilities have been checked.
3. Security and data-access issues have been corrected where necessary.
4. The complete replacement file has been checked using:

   ```powershell
   npx tsc --noEmit
   ```

5. Its documentation has been created under `docs/backend/services/`.
6. Its catalog entry has been verified.

A successful TypeScript check confirms type consistency; it does not independently prove runtime correctness or security.

## 5. Architecture rules

All services must follow the rules in:

- `architecture.md`
- `authorization-rules.md`
- `realtime.md`

Important requirements:

- Use `server-only` for server-side services.
- Use Drizzle for application database operations.
- Validate untrusted inputs.
- Enforce authorization explicitly in services.
- Never trust client-submitted user IDs as proof of identity.
- Never expose privileged database credentials.
- Do not trust `user_metadata` for administrator roles.
- Keep business logic out of API route handlers.
- Use Supabase Auth for identity and sessions.
- Use Supabase Storage for media and Supabase Realtime for live updates.

## 6. Controller integration status

**API routes and controllers have not yet been introduced.**

Controller development must wait until:
- All existing backend services have been audited.
- Individual service documentation is complete.
- This catalog has been updated.
- Cross-service authorization responsibilities have been reviewed.

The intended request flow is:

`Frontend → Next.js API Route Handler → Validation and Authentication → Service → Drizzle → PostgreSQL`

## 7. Maintenance

Whenever a service is corrected, added, renamed, or removed:

1. Update its individual documentation.
2. Update this catalog.
3. Record its current audit and typecheck status.
4. Review any affected cross-service authorization rules.

This file is the central index of the Atoll backend service layer.
