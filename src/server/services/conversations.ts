import "server-only";

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { conversationMembers, conversations } from "@/db/schema/conversation";
import { blocks } from "@/db/schema/reaction";
import { profiles } from "@/db/schema/profiles";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const createDirectConversationSchema = z
  .object({
    participantId: uuidSchema,
  })
  .strict();

const createGroupConversationSchema = z
  .object({
    participantIds: z.array(uuidSchema).min(1).max(49),
  })
  .strict();

const addMemberSchema = z
  .object({
    userId: uuidSchema,
  })
  .strict();

export type CreateDirectConversationInput = z.infer<
  typeof createDirectConversationSchema
>;

export type CreateGroupConversationInput = z.infer<
  typeof createGroupConversationSchema
>;

export type AddConversationMemberInput = z.infer<typeof addMemberSchema>;

function validateUuid(value: string, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(
      `Invalid ${fieldName}.`,
      "INVALID_CONVERSATION_INPUT",
      400,
    );
  }

  return result.data;
}

// -----------------------------------------------------------------------------
// Account and block checks
// -----------------------------------------------------------------------------

async function assertActiveUser(userId: string) {
  const [user] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, userId), eq(profiles.accountStatus, "active")))
    .limit(1);

  if (!user) {
    throw new AppError(
      "Your account is not available for this action.",
      "ACCOUNT_NOT_ACTIVE",
      403,
    );
  }
}

async function assertActiveUsers(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];

  const activeUsers = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(
        inArray(profiles.id, uniqueIds),
        eq(profiles.accountStatus, "active"),
      ),
    );

  if (activeUsers.length !== uniqueIds.length) {
    throw new AppError(
      "One or more participants are unavailable.",
      "PARTICIPANT_NOT_AVAILABLE",
      404,
    );
  }
}

async function assertNoBlockBetweenUsers(
  firstUserId: string,
  secondUserId: string,
) {
  const [relationship] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(
          eq(blocks.blockerId, firstUserId),
          eq(blocks.blockedId, secondUserId),
        ),
        and(
          eq(blocks.blockerId, secondUserId),
          eq(blocks.blockedId, firstUserId),
        ),
      ),
    )
    .limit(1);

  if (relationship) {
    throw new AppError(
      "You cannot start or join a conversation with this user.",
      "INTERACTION_BLOCKED",
      403,
    );
  }
}

async function assertNoBlocksAmongUsers(userIds: string[]) {
  const uniqueIds = [...new Set(userIds)];

  if (uniqueIds.length < 2) {
    return;
  }

  const [relationship] = await db
    .select({
      id: blocks.id,
    })
    .from(blocks)
    .where(
      and(
        inArray(blocks.blockerId, uniqueIds),
        inArray(blocks.blockedId, uniqueIds),
      ),
    )
    .limit(1);

  if (relationship) {
    throw new AppError(
      "A conversation cannot include users who have blocked each other.",
      "INTERACTION_BLOCKED",
      403,
    );
  }
}

// -----------------------------------------------------------------------------
// Conversation membership
// -----------------------------------------------------------------------------

/**
 * Confirms that a user is an active member of a conversation.
 */
export async function isConversationMember(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );
  const validatedUserId = validateUuid(userId, "user ID");

  const [membership] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, validatedConversationId),
        eq(conversationMembers.userId, validatedUserId),
        eq(conversationMembers.isActive, true),
      ),
    )
    .limit(1);

  return Boolean(membership);
}

// -----------------------------------------------------------------------------
// Find an existing direct conversation
// -----------------------------------------------------------------------------

/**
 * Finds an existing direct conversation shared by exactly two active members.
 */
async function findExistingDirectConversation(
  firstUserId: string,
  secondUserId: string,
) {
  const candidates = await db
    .select({
      conversationId: conversations.id,
    })
    .from(conversations)
    .innerJoin(
      conversationMembers,
      eq(conversationMembers.conversationId, conversations.id),
    )
    .where(
      and(
        eq(conversations.conversationType, "direct"),
        eq(conversationMembers.userId, firstUserId),
        eq(conversationMembers.isActive, true),
      ),
    );

  if (candidates.length === 0) {
    return null;
  }

  const candidateIds = candidates.map((item) => item.conversationId);

  const members = await db
    .select({
      conversationId: conversationMembers.conversationId,
      userId: conversationMembers.userId,
    })
    .from(conversationMembers)
    .where(
      and(
        inArray(conversationMembers.conversationId, candidateIds),
        eq(conversationMembers.isActive, true),
      ),
    );

  const membersByConversation = new Map<string, string[]>();

  for (const member of members) {
    const current = membersByConversation.get(member.conversationId) ?? [];

    current.push(member.userId);
    membersByConversation.set(member.conversationId, current);
  }

  for (const candidateId of candidateIds) {
    const participantIds = membersByConversation.get(candidateId) ?? [];

    if (
      participantIds.length === 2 &&
      participantIds.includes(firstUserId) &&
      participantIds.includes(secondUserId)
    ) {
      return candidateId;
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Create direct conversation
// -----------------------------------------------------------------------------

/**
 * Creates a direct conversation or returns an existing one.
 */
export async function createDirectConversation(
  userId: string,
  input: CreateDirectConversationInput,
) {
  const validatedUserId = validateUuid(userId, "user ID");

  const validatedInput = createDirectConversationSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid conversation participant.",
      "INVALID_CONVERSATION_PARTICIPANT",
      400,
    );
  }

  const { participantId } = validatedInput.data;

  if (validatedUserId === participantId) {
    throw new AppError(
      "You cannot start a conversation with yourself.",
      "INVALID_CONVERSATION_PARTICIPANT",
      400,
    );
  }

  await assertActiveUsers([validatedUserId, participantId]);

  await assertNoBlockBetweenUsers(validatedUserId, participantId);

  const existingConversationId = await findExistingDirectConversation(
    validatedUserId,
    participantId,
  );

  if (existingConversationId) {
    return {
      conversationId: existingConversationId,
      created: false,
    };
  }

  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(conversations)
      .values({
        conversationType: "direct",
        createdBy: validatedUserId,
      })
      .returning({
        id: conversations.id,
      });

    await tx.insert(conversationMembers).values([
      {
        conversationId: conversation.id,
        userId: validatedUserId,
      },
      {
        conversationId: conversation.id,
        userId: participantId,
      },
    ]);

    return {
      conversationId: conversation.id,
      created: true,
    };
  });
}

// -----------------------------------------------------------------------------
// Create group conversation
// -----------------------------------------------------------------------------

/**
 * Creates a group conversation.
 * The creator is automatically included as a member.
 */
export async function createGroupConversation(
  creatorId: string,
  input: CreateGroupConversationInput,
) {
  const validatedCreatorId = validateUuid(creatorId, "creator ID");

  const validatedInput = createGroupConversationSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid group participants.",
      "INVALID_GROUP_PARTICIPANTS",
      400,
    );
  }

  const uniqueParticipantIds = [
    ...new Set(validatedInput.data.participantIds),
  ].filter((id) => id !== validatedCreatorId);

  if (uniqueParticipantIds.length === 0) {
    throw new AppError(
      "A group needs at least one other participant.",
      "GROUP_REQUIRES_PARTICIPANTS",
      400,
    );
  }

  const allMemberIds = [validatedCreatorId, ...uniqueParticipantIds];

  await assertActiveUsers(allMemberIds);

  // A group must not bring together users who have blocked each other.
  await assertNoBlocksAmongUsers(allMemberIds);

  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .insert(conversations)
      .values({
        conversationType: "group",
        createdBy: validatedCreatorId,
      })
      .returning({
        id: conversations.id,
      });

    await tx.insert(conversationMembers).values(
      allMemberIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
      })),
    );

    return {
      conversationId: conversation.id,
      memberCount: allMemberIds.length,
    };
  });
}

// -----------------------------------------------------------------------------
// Add member to group
// -----------------------------------------------------------------------------

/**
 * Adds a member to a group.
 * Only the active group creator can add members.
 */
export async function addConversationMember(
  actorId: string,
  conversationId: string,
  input: AddConversationMemberInput,
) {
  const validatedActorId = validateUuid(actorId, "actor ID");
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );

  const validatedInput = addMemberSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid conversation member.",
      "INVALID_CONVERSATION_MEMBER",
      400,
    );
  }

  const { userId } = validatedInput.data;

  await assertActiveUser(validatedActorId);
  await assertActiveUser(userId);

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, validatedConversationId))
    .limit(1);

  if (!conversation) {
    throw new AppError(
      "Conversation not found.",
      "CONVERSATION_NOT_FOUND",
      404,
    );
  }

  if (conversation.conversationType !== "group") {
    throw new AppError(
      "Members can only be added to group conversations.",
      "NOT_A_GROUP_CONVERSATION",
      400,
    );
  }

  if (conversation.createdBy !== validatedActorId) {
    throw new AppError(
      "Only the group creator can add members.",
      "FORBIDDEN",
      403,
    );
  }

  const actorIsMember = await isConversationMember(
    validatedConversationId,
    validatedActorId,
  );

  if (!actorIsMember) {
    throw new AppError(
      "You are no longer an active member of this conversation.",
      "NOT_CONVERSATION_MEMBER",
      403,
    );
  }

  if (validatedActorId === userId) {
    throw new AppError(
      "You are already a member of this conversation.",
      "ALREADY_CONVERSATION_MEMBER",
      400,
    );
  }

  return db.transaction(async (tx) => {
    const activeMembers = await tx
      .select({
        userId: conversationMembers.userId,
      })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, validatedConversationId),
          eq(conversationMembers.isActive, true),
        ),
      );

    const activeMemberIds = activeMembers.map((member) => member.userId);

    if (activeMemberIds.includes(userId)) {
      return { added: false };
    }

    if (activeMemberIds.length >= 50) {
      throw new AppError(
        "This group has reached its 50-member limit.",
        "GROUP_MEMBER_LIMIT_REACHED",
        400,
      );
    }

    // Prevent adding a user who has blocked or been blocked by
    // any current group member.
    const [blockRelationship] = await tx
      .select({
        id: blocks.id,
      })
      .from(blocks)
      .where(
        and(
          inArray(blocks.blockerId, [...activeMemberIds, userId]),
          inArray(blocks.blockedId, [...activeMemberIds, userId]),
        ),
      )
      .limit(1);

    if (blockRelationship) {
      throw new AppError(
        "This user cannot be added because of a blocking relationship.",
        "INTERACTION_BLOCKED",
        403,
      );
    }

    const [existingMembership] = await tx
      .select()
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, validatedConversationId),
          eq(conversationMembers.userId, userId),
        ),
      )
      .limit(1);

    if (existingMembership) {
      await tx
        .update(conversationMembers)
        .set({
          isActive: true,
          joinedAt: new Date(),
        })
        .where(eq(conversationMembers.id, existingMembership.id));
    } else {
      await tx.insert(conversationMembers).values({
        conversationId: validatedConversationId,
        userId,
      });
    }

    await tx
      .update(conversations)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, validatedConversationId));

    return { added: true };
  });
}

// -----------------------------------------------------------------------------
// Remove member or leave conversation
// -----------------------------------------------------------------------------

/**
 * Allows a member to leave a conversation.
 * In groups, the active creator can also remove another member.
 */
export async function removeConversationMember(
  actorId: string,
  conversationId: string,
  targetUserId: string,
) {
  const validatedActorId = validateUuid(actorId, "actor ID");
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );
  const validatedTargetId = validateUuid(targetUserId, "target user ID");

  const actorIsLeaving = validatedActorId === validatedTargetId;

  if (!actorIsLeaving) {
    await assertActiveUser(validatedActorId);
  }

  return db.transaction(async (tx) => {
    const [conversation] = await tx
      .select()
      .from(conversations)
      .where(eq(conversations.id, validatedConversationId))
      .limit(1);

    if (!conversation) {
      throw new AppError(
        "Conversation not found.",
        "CONVERSATION_NOT_FOUND",
        404,
      );
    }

    // Direct conversation members may only leave themselves.
    if (!actorIsLeaving && conversation.conversationType !== "group") {
      throw new AppError(
        "Members cannot remove another participant from a direct conversation.",
        "FORBIDDEN",
        403,
      );
    }

    if (!actorIsLeaving && conversation.createdBy !== validatedActorId) {
      throw new AppError(
        "Only the group creator can remove another member.",
        "FORBIDDEN",
        403,
      );
    }

    const [actorMembership] = await tx
      .select({
        id: conversationMembers.id,
      })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, validatedConversationId),
          eq(conversationMembers.userId, validatedActorId),
          eq(conversationMembers.isActive, true),
        ),
      )
      .limit(1);

    if (!actorMembership) {
      throw new AppError(
        "You are not an active member of this conversation.",
        "NOT_CONVERSATION_MEMBER",
        403,
      );
    }

    const [targetMembership] = await tx
      .select({
        id: conversationMembers.id,
      })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.conversationId, validatedConversationId),
          eq(conversationMembers.userId, validatedTargetId),
          eq(conversationMembers.isActive, true),
        ),
      )
      .limit(1);

    if (!targetMembership) {
      return { removed: false };
    }

    await tx
      .update(conversationMembers)
      .set({
        isActive: false,
      })
      .where(eq(conversationMembers.id, targetMembership.id));

    await tx
      .update(conversations)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, validatedConversationId));

    return { removed: true };
  });
}

// -----------------------------------------------------------------------------
// Get user's conversations
// -----------------------------------------------------------------------------

/**
 * Lists active conversations belonging to an active user.
 */
export async function getUserConversations(userId: string) {
  const validatedUserId = validateUuid(userId, "user ID");

  await assertActiveUser(validatedUserId);

  return db
    .select({
      id: conversations.id,
      conversationType: conversations.conversationType,
      createdBy: conversations.createdBy,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      joinedAt: conversationMembers.joinedAt,
      lastReadAt: conversationMembers.lastReadAt,
    })
    .from(conversationMembers)
    .innerJoin(
      conversations,
      eq(conversations.id, conversationMembers.conversationId),
    )
    .where(
      and(
        eq(conversationMembers.userId, validatedUserId),
        eq(conversationMembers.isActive, true),
      ),
    )
    .orderBy(desc(conversations.updatedAt));
}

// -----------------------------------------------------------------------------
// Mark conversation as read
// -----------------------------------------------------------------------------

/**
 * Updates the current active member's last-read timestamp.
 */
export async function markConversationAsRead(
  userId: string,
  conversationId: string,
) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );

  await assertActiveUser(validatedUserId);

  const [membership] = await db
    .update(conversationMembers)
    .set({
      lastReadAt: new Date(),
    })
    .where(
      and(
        eq(conversationMembers.conversationId, validatedConversationId),
        eq(conversationMembers.userId, validatedUserId),
        eq(conversationMembers.isActive, true),
      ),
    )
    .returning({
      id: conversationMembers.id,
    });

  if (!membership) {
    throw new AppError(
      "You are not an active member of this conversation.",
      "NOT_CONVERSATION_MEMBER",
      403,
    );
  }

  return { updated: true };
}

// -----------------------------------------------------------------------------
// Get conversation details
// -----------------------------------------------------------------------------

/**
 * Retrieves a conversation and its active members.
 * Only active members can view conversation details.
 */
export async function getConversationDetails(
  userId: string,
  conversationId: string,
) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, validatedConversationId))
    .limit(1);

  if (!conversation) {
    throw new AppError(
      "Conversation not found.",
      "CONVERSATION_NOT_FOUND",
      404,
    );
  }

  const isMember = await isConversationMember(
    validatedConversationId,
    validatedUserId,
  );

  if (!isMember) {
    throw new AppError(
      "You are not an active member of this conversation.",
      "NOT_CONVERSATION_MEMBER",
      403,
    );
  }

  const members = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      joinedAt: conversationMembers.joinedAt,
      lastReadAt: conversationMembers.lastReadAt,
    })
    .from(conversationMembers)
    .innerJoin(profiles, eq(profiles.id, conversationMembers.userId))
    .where(
      and(
        eq(conversationMembers.conversationId, validatedConversationId),
        eq(conversationMembers.isActive, true),
      ),
    );

  return {
    ...conversation,
    members,
  };
}
