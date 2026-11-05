import "server-only";

import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { conversationMembers, conversations } from "@/db/schema/conversation";
import { messages } from "@/db/schema/messages";
import { blocks } from "@/db/schema/reaction";
import { profiles } from "@/db/schema/profiles";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

function validateUuid(value: string, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(`Invalid ${fieldName}.`, "INVALID_MESSAGE_INPUT", 400);
  }

  return result.data;
}

const createMessageSchema = z
  .object({
    content: z.string().trim().max(5000).nullable().optional(),
    messageType: z.enum(["text", "image"]).default("text"),
    mediaPath: z.string().trim().min(1).max(1000).nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const content = value.content?.trim() ?? null;
    const mediaPath = value.mediaPath?.trim() ?? null;

    if (value.messageType === "text" && !content) {
      context.addIssue({
        code: "custom",
        message: "Text messages cannot be empty.",
        path: ["content"],
      });
    }

    if (value.messageType === "text" && mediaPath) {
      context.addIssue({
        code: "custom",
        message: "Text messages cannot include image media.",
        path: ["mediaPath"],
      });
    }

    if (value.messageType === "image" && !mediaPath) {
      context.addIssue({
        code: "custom",
        message: "Image messages require a media path.",
        path: ["mediaPath"],
      });
    }
  });

const updateMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

const paginationSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).max(100000).default(0),
  })
  .strict();

const latestLimitSchema = z.number().int().min(1).max(100);

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

// -----------------------------------------------------------------------------
// Account and membership checks
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

/**
 * Checks active membership and prevents interaction with users
 * who have a blocking relationship with the current user.
 */
async function assertCanAccessConversation(
  conversationId: string,
  userId: string,
) {
  await assertActiveUser(userId);

  const [membership] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
        eq(conversationMembers.isActive, true),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AppError(
      "You are not an active member of this conversation.",
      "NOT_CONVERSATION_MEMBER",
      403,
    );
  }

  const otherMembers = await db
    .select({
      userId: conversationMembers.userId,
    })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.isActive, true),
      ),
    );

  const otherUserIds = otherMembers
    .map((member) => member.userId)
    .filter((id) => id !== userId);

  if (otherUserIds.length === 0) {
    return;
  }

  const [blockRelationship] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(
          eq(blocks.blockerId, userId),
          inArray(blocks.blockedId, otherUserIds),
        ),
        and(
          inArray(blocks.blockerId, otherUserIds),
          eq(blocks.blockedId, userId),
        ),
      ),
    )
    .limit(1);

  if (blockRelationship) {
    throw new AppError(
      "You cannot interact in this conversation because of a blocking relationship.",
      "INTERACTION_BLOCKED",
      403,
    );
  }
}

/**
 * Confirms active membership without applying block restrictions.
 *
 * This is used for deleting your own message. A blocking relationship
 * should not prevent a user from removing their own content.
 */
async function assertActiveMembership(conversationId: string, userId: string) {
  const [membership] = await db
    .select({ id: conversationMembers.id })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
        eq(conversationMembers.isActive, true),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AppError(
      "You are not an active member of this conversation.",
      "NOT_CONVERSATION_MEMBER",
      403,
    );
  }
}

// -----------------------------------------------------------------------------
// Media validation
// -----------------------------------------------------------------------------

/**
 * Ensures that an image message references a path belonging to its sender.
 *
 * This checks the application's storage-path convention. It does not
 * independently verify that the file exists in Supabase Storage.
 */
function validateMediaPath(mediaPath: string, senderId: string): string {
  const normalizedPath = mediaPath.trim();
  const segments = normalizedPath.split("/");

  if (
    !normalizedPath.startsWith(`${senderId}/`) ||
    normalizedPath.startsWith("/") ||
    normalizedPath.includes("\\") ||
    segments.some((segment) => segment === "." || segment === "..") ||
    segments.some((segment) => segment.length === 0)
  ) {
    throw new AppError(
      "The image media path is invalid or does not belong to you.",
      "INVALID_MESSAGE_MEDIA_PATH",
      400,
    );
  }

  return normalizedPath;
}

// -----------------------------------------------------------------------------
// Send message
// -----------------------------------------------------------------------------

/**
 * Sends a text or image message to a conversation.
 */
export async function sendMessage(
  senderId: string,
  conversationId: string,
  input: CreateMessageInput,
) {
  const validatedSenderId = validateUuid(senderId, "sender ID");
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );

  const validatedInput = createMessageSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid message content.",
      "INVALID_MESSAGE_INPUT",
      400,
    );
  }

  const data = validatedInput.data;

  await assertCanAccessConversation(validatedConversationId, validatedSenderId);

  const mediaPath = data.mediaPath?.trim() || null;

  const validatedMediaPath = mediaPath
    ? validateMediaPath(mediaPath, validatedSenderId)
    : null;

  return db.transaction(async (tx) => {
    const [message] = await tx
      .insert(messages)
      .values({
        conversationId: validatedConversationId,
        senderId: validatedSenderId,
        content: data.content?.trim() || null,
        messageType: data.messageType,
        mediaPath: validatedMediaPath,
      })
      .returning();

    await tx
      .update(conversations)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, validatedConversationId));

    return message;
  });
}

// -----------------------------------------------------------------------------
// Get conversation messages
// -----------------------------------------------------------------------------

/**
 * Retrieves messages in chronological order.
 * Pagination uses a bounded limit and offset.
 */
export async function getConversationMessages(
  userId: string,
  conversationId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {},
) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );

  const pagination = paginationSchema.safeParse(options);

  if (!pagination.success) {
    throw new AppError(
      "Invalid message pagination options.",
      "INVALID_MESSAGE_PAGINATION",
      400,
    );
  }

  await assertCanAccessConversation(validatedConversationId, validatedUserId);

  return db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, validatedConversationId),
        isNull(messages.deletedAt),
      ),
    )
    .orderBy(asc(messages.createdAt), asc(messages.id))
    .limit(pagination.data.limit)
    .offset(pagination.data.offset);
}

// -----------------------------------------------------------------------------
// Get latest conversation messages
// -----------------------------------------------------------------------------

/**
 * Retrieves the newest messages first, then returns them chronologically.
 */
export async function getLatestConversationMessages(
  userId: string,
  conversationId: string,
  limit = 50,
) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedConversationId = validateUuid(
    conversationId,
    "conversation ID",
  );

  const validatedLimit = latestLimitSchema.safeParse(limit);

  if (!validatedLimit.success) {
    throw new AppError(
      "Invalid message limit.",
      "INVALID_MESSAGE_PAGINATION",
      400,
    );
  }

  await assertCanAccessConversation(validatedConversationId, validatedUserId);

  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, validatedConversationId),
        isNull(messages.deletedAt),
      ),
    )
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(validatedLimit.data);

  return result.reverse();
}

// -----------------------------------------------------------------------------
// Update message
// -----------------------------------------------------------------------------

/**
 * Edits a text message owned by the current user.
 */
export async function updateMessage(
  userId: string,
  messageId: string,
  input: UpdateMessageInput,
) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedMessageId = validateUuid(messageId, "message ID");

  const validatedInput = updateMessageSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid message content.",
      "INVALID_MESSAGE_INPUT",
      400,
    );
  }

  const [existingMessage] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, validatedMessageId),
        eq(messages.senderId, validatedUserId),
        isNull(messages.deletedAt),
      ),
    )
    .limit(1);

  if (!existingMessage) {
    throw new AppError(
      "Message not found or you are not allowed to edit it.",
      "MESSAGE_NOT_FOUND",
      404,
    );
  }

  if (existingMessage.messageType !== "text") {
    throw new AppError(
      "Only text messages can be edited.",
      "MESSAGE_NOT_EDITABLE",
      400,
    );
  }

  await assertCanAccessConversation(
    existingMessage.conversationId,
    validatedUserId,
  );

  const [updatedMessage] = await db
    .update(messages)
    .set({
      content: validatedInput.data.content,
      editedAt: new Date(),
    })
    .where(
      and(
        eq(messages.id, validatedMessageId),
        eq(messages.senderId, validatedUserId),
        eq(messages.messageType, "text"),
        isNull(messages.deletedAt),
      ),
    )
    .returning();

  if (!updatedMessage) {
    throw new AppError(
      "The message could not be updated.",
      "MESSAGE_UPDATE_FAILED",
      409,
    );
  }

  return updatedMessage;
}

// -----------------------------------------------------------------------------
// Delete message
// -----------------------------------------------------------------------------

/**
 * Soft-deletes a message owned by the current user.
 *
 * A blocking relationship does not prevent users from deleting
 * their own messages.
 */
export async function deleteMessage(userId: string, messageId: string) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedMessageId = validateUuid(messageId, "message ID");

  const [existingMessage] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.id, validatedMessageId),
        eq(messages.senderId, validatedUserId),
        isNull(messages.deletedAt),
      ),
    )
    .limit(1);

  if (!existingMessage) {
    throw new AppError(
      "Message not found or you are not allowed to delete it.",
      "MESSAGE_NOT_FOUND",
      404,
    );
  }

  await assertActiveMembership(existingMessage.conversationId, validatedUserId);

  const [deletedMessage] = await db
    .update(messages)
    .set({
      content: null,
      mediaPath: null,
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(messages.id, validatedMessageId),
        eq(messages.senderId, validatedUserId),
        isNull(messages.deletedAt),
      ),
    )
    .returning({
      id: messages.id,
    });

  return {
    deleted: Boolean(deletedMessage),
  };
}
