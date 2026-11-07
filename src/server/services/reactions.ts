import "server-only";

import { and, count, eq, or, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  blocks,
  comments,
  follows,
  posts,
  profiles,
  reactions,
} from "@/db/schema";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const reactionSchema = z
  .object({
    // Keep this flexible until the product defines its supported reaction list.
    reactionType: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .regex(
        /^[a-zA-Z][a-zA-Z0-9_-]*$/,
        "Reaction type must contain only letters, numbers, underscores, or hyphens.",
      ),
  })
  .strict();

export type SetReactionInput = z.infer<typeof reactionSchema>;

// -----------------------------------------------------------------------------
// Shared validation
// -----------------------------------------------------------------------------

function validateUuid(value: string, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(
      `Invalid ${fieldName}.`,
      "INVALID_REACTION_IDENTIFIER",
      400,
    );
  }

  return result.data;
}

// -----------------------------------------------------------------------------
// Account and block checks
// -----------------------------------------------------------------------------

async function assertActiveUser(userId: string) {
  const [profile] = await db
    .select({
      id: profiles.id,
    })
    .from(profiles)
    .where(and(eq(profiles.id, userId), eq(profiles.accountStatus, "active")))
    .limit(1);

  if (!profile) {
    throw new AppError(
      "Your account is not available for this action.",
      "ACCOUNT_NOT_ACTIVE",
      403,
    );
  }
}

async function assertNoBlockBetweenUsers(
  firstUserId: string,
  secondUserId: string,
) {
  const [block] = await db
    .select({
      id: blocks.id,
    })
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

  if (block) {
    throw new AppError(
      "This interaction is not available.",
      "INTERACTION_BLOCKED",
      403,
    );
  }
}

// -----------------------------------------------------------------------------
// Post access
// -----------------------------------------------------------------------------

async function assertCanAccessPost(userId: string, postId: string) {
  await assertActiveUser(userId);

  const [post] = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      visibility: posts.visibility,
      status: posts.status,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post || post.status !== "active") {
    throw new AppError("Post not found.", "POST_NOT_FOUND", 404);
  }

  // The author must also have an active account.
  await assertActiveUser(post.authorId);

  // Blocking applies to public posts as well as follower-only posts.
  await assertNoBlockBetweenUsers(userId, post.authorId);

  if (post.authorId === userId || post.visibility === "public") {
    return;
  }

  const [follow] = await db
    .select({
      id: follows.id,
    })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, userId),
        eq(follows.followingId, post.authorId),
      ),
    )
    .limit(1);

  if (!follow) {
    throw new AppError(
      "You do not have permission to access this post.",
      "POST_ACCESS_DENIED",
      403,
    );
  }
}

// -----------------------------------------------------------------------------
// Comment access
// -----------------------------------------------------------------------------

async function assertCanAccessComment(userId: string, commentId: string) {
  await assertActiveUser(userId);

  const [comment] = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      status: comments.status,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment || comment.status !== "active") {
    throw new AppError("Comment not found.", "COMMENT_NOT_FOUND", 404);
  }

  // The viewer must be allowed to access the post containing this comment.
  await assertCanAccessPost(userId, comment.postId);

  // The comment author must have an active account.
  await assertActiveUser(comment.authorId);

  // Blocking prevents reactions in either direction.
  await assertNoBlockBetweenUsers(userId, comment.authorId);
}

// -----------------------------------------------------------------------------
// Add or change a reaction
// -----------------------------------------------------------------------------

export async function setReaction(
  userId: string,
  postId: string,
  input: SetReactionInput,
) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedPostId = validateUuid(postId, "post ID");

  const validatedInput = reactionSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError("Invalid reaction.", "INVALID_REACTION", 400);
  }

  await assertCanAccessPost(validatedUserId, validatedPostId);

  const [result] = await db
    .insert(reactions)
    .values({
      postId: validatedPostId,
      userId: validatedUserId,
      reactionType: validatedInput.data.reactionType,
    })
    .onConflictDoUpdate({
      target: [reactions.postId, reactions.userId],
      targetWhere: sql`${reactions.postId} IS NOT NULL`,
      set: {
        reactionType: validatedInput.data.reactionType,
        createdAt: new Date(),
      },
    })
    .returning();

  if (!result) {
    throw new AppError(
      "The reaction could not be saved.",
      "REACTION_SAVE_FAILED",
      500,
    );
  }

  return result;
}

// -----------------------------------------------------------------------------
// Remove own reaction
// -----------------------------------------------------------------------------

export async function removeReaction(userId: string, postId: string) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedPostId = validateUuid(postId, "post ID");

  await assertActiveUser(validatedUserId);

  // Deliberately does not require current post access.
  // A user must be able to remove their own reaction even if visibility
  // changes or either party blocks the other after the reaction was created.
  const [deletedReaction] = await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.postId, validatedPostId),
        eq(reactions.userId, validatedUserId),
      ),
    )
    .returning({
      id: reactions.id,
      postId: reactions.postId,
    });

  return {
    removed: Boolean(deletedReaction),
    reaction: deletedReaction ?? null,
  };
}

// -----------------------------------------------------------------------------
// Get reaction counts
// -----------------------------------------------------------------------------

export async function getPostReactionCounts(viewerId: string, postId: string) {
  const validatedViewerId = validateUuid(viewerId, "viewer ID");
  const validatedPostId = validateUuid(postId, "post ID");

  await assertCanAccessPost(validatedViewerId, validatedPostId);

  const results = await db
    .select({
      reactionType: reactions.reactionType,
      total: count(),
    })
    .from(reactions)
    .where(eq(reactions.postId, validatedPostId))
    .groupBy(reactions.reactionType);

  return results.map((item) => ({
    reactionType: item.reactionType,
    total: Number(item.total),
  }));
}

// -----------------------------------------------------------------------------
// Get current user's reaction on a post
// -----------------------------------------------------------------------------

export async function getUserReaction(userId: string, postId: string) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedPostId = validateUuid(postId, "post ID");

  await assertCanAccessPost(validatedUserId, validatedPostId);

  const [reaction] = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.postId, validatedPostId),
        eq(reactions.userId, validatedUserId),
      ),
    )
    .limit(1);

  return reaction ?? null;
}

// -----------------------------------------------------------------------------
// Add or change a comment reaction
// -----------------------------------------------------------------------------

export async function setCommentReaction(
  userId: string,
  commentId: string,
  input: SetReactionInput,
) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedCommentId = validateUuid(commentId, "comment ID");

  const validatedInput = reactionSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError("Invalid reaction.", "INVALID_REACTION", 400);
  }

  await assertCanAccessComment(validatedUserId, validatedCommentId);

  const [result] = await db
    .insert(reactions)
    .values({
      commentId: validatedCommentId,
      userId: validatedUserId,
      reactionType: validatedInput.data.reactionType,
    })
    .onConflictDoUpdate({
      target: [reactions.commentId, reactions.userId],
      targetWhere: sql`${reactions.commentId} IS NOT NULL`,
      set: {
        reactionType: validatedInput.data.reactionType,
        createdAt: new Date(),
      },
    })
    .returning();

  if (!result) {
    throw new AppError(
      "The comment reaction could not be saved.",
      "COMMENT_REACTION_SAVE_FAILED",
      500,
    );
  }

  return result;
}

// -----------------------------------------------------------------------------
// Remove own comment reaction
// -----------------------------------------------------------------------------

export async function removeCommentReaction(userId: string, commentId: string) {
  const validatedUserId = validateUuid(userId, "user ID");
  const validatedCommentId = validateUuid(commentId, "comment ID");

  await assertActiveUser(validatedUserId);

  // Deliberately does not require current comment access.
  // A user must be able to remove their own reaction even if access changes.
  const [deletedReaction] = await db
    .delete(reactions)
    .where(
      and(
        eq(reactions.commentId, validatedCommentId),
        eq(reactions.userId, validatedUserId),
      ),
    )
    .returning({
      id: reactions.id,
      commentId: reactions.commentId,
    });

  return {
    removed: Boolean(deletedReaction),
    reaction: deletedReaction ?? null,
  };
}
