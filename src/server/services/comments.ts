import "server-only";

import { and, asc, eq, exists, notExists, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { comments, follows, posts } from "@/db/schema";
import { blocks } from "@/db/schema/reaction";
import { profiles } from "@/db/schema/profiles";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const createCommentSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
    parentId: uuidSchema.nullable().optional(),
  })
  .strict();

const updateCommentSchema = z
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

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

function validateUuid(value: string, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(`Invalid ${fieldName}.`, "INVALID_COMMENT_ID", 400);
  }

  return result.data;
}

function validatePagination(limit: number, offset: number) {
  const result = paginationSchema.safeParse({ limit, offset });

  if (!result.success) {
    throw new AppError(
      "Invalid pagination options.",
      "INVALID_COMMENT_PAGINATION",
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

async function hasBlockBetweenUsers(
  firstUserId: string,
  secondUserId: string,
): Promise<boolean> {
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

  return Boolean(relationship);
}

async function assertNoBlockBetweenUsers(
  firstUserId: string,
  secondUserId: string,
) {
  if (await hasBlockBetweenUsers(firstUserId, secondUserId)) {
    throw new AppError(
      "You cannot interact with this user.",
      "INTERACTION_BLOCKED",
      403,
    );
  }
}

// -----------------------------------------------------------------------------
// Post access
// -----------------------------------------------------------------------------

async function assertCanAccessPost(viewerId: string, postId: string) {
  await assertActiveUser(viewerId);

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

  const [activeAuthor] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(
      and(eq(profiles.id, post.authorId), eq(profiles.accountStatus, "active")),
    )
    .limit(1);

  if (!activeAuthor) {
    throw new AppError("Post not found.", "POST_NOT_FOUND", 404);
  }

  // Blocking prevents interactions even when the post is public.
  await assertNoBlockBetweenUsers(viewerId, post.authorId);

  // Post authors can access their own posts.
  if (post.authorId === viewerId) {
    return post;
  }

  // Public posts are accessible to everyone.
  if (post.visibility === "public") {
    return post;
  }

  // Followers-only posts require an active follow relationship.
  const [follow] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, viewerId),
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

  return post;
}

// -----------------------------------------------------------------------------
// Create comment or reply
// -----------------------------------------------------------------------------

export async function createComment(
  authorId: string,
  postId: string,
  input: CreateCommentInput,
) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedPostId = validateUuid(postId, "post ID");

  const validatedInput = createCommentSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid comment information.",
      "INVALID_COMMENT_INPUT",
      400,
    );
  }

  const { content, parentId } = validatedInput.data;

  await assertCanAccessPost(validatedAuthorId, validatedPostId);

  // If this is a reply, verify that its parent belongs to this post.
  if (parentId) {
    const [parentComment] = await db
      .select({
        id: comments.id,
        parentId: comments.parentId,
        authorId: comments.authorId,
      })
      .from(comments)
      .where(
        and(
          eq(comments.id, parentId),
          eq(comments.postId, validatedPostId),
          eq(comments.status, "active"),
        ),
      )
      .limit(1);

    if (!parentComment) {
      throw new AppError(
        "Parent comment not found.",
        "PARENT_COMMENT_NOT_FOUND",
        404,
      );
    }

    // Replies are limited to one level: a reply cannot have another reply.
    if (parentComment.parentId !== null) {
      throw new AppError(
        "Replies cannot be nested more than one level.",
        "COMMENT_NESTING_NOT_ALLOWED",
        400,
      );
    }

    const [activeParentAuthor] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.id, parentComment.authorId),
          eq(profiles.accountStatus, "active"),
        ),
      )
      .limit(1);

    if (!activeParentAuthor) {
      throw new AppError(
        "Parent comment not found.",
        "PARENT_COMMENT_NOT_FOUND",
        404,
      );
    }

    await assertNoBlockBetweenUsers(validatedAuthorId, parentComment.authorId);
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      postId: validatedPostId,
      authorId: validatedAuthorId,
      parentId: parentId ?? null,
      content,
    })
    .returning();

  return newComment;
}

// -----------------------------------------------------------------------------
// Retrieve comments for a post
// -----------------------------------------------------------------------------

export async function getPostComments(
  viewerId: string,
  postId: string,
  limit = 50,
  offset = 0,
) {
  const validatedViewerId = validateUuid(viewerId, "viewer ID");
  const validatedPostId = validateUuid(postId, "post ID");
  const pagination = validatePagination(limit, offset);

  await assertCanAccessPost(validatedViewerId, validatedPostId);

  return db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.postId, validatedPostId),
        eq(comments.status, "active"),

        // Only show comments from active accounts.
        exists(
          db
            .select({ id: profiles.id })
            .from(profiles)
            .where(
              and(
                eq(profiles.id, comments.authorId),
                eq(profiles.accountStatus, "active"),
              ),
            ),
        ),

        // Hide comments from users blocked in either direction.
        notExists(
          db
            .select({ id: blocks.id })
            .from(blocks)
            .where(
              or(
                and(
                  eq(blocks.blockerId, validatedViewerId),
                  eq(blocks.blockedId, comments.authorId),
                ),
                and(
                  eq(blocks.blockerId, comments.authorId),
                  eq(blocks.blockedId, validatedViewerId),
                ),
              ),
            ),
        ),
      ),
    )
    .orderBy(asc(comments.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

// -----------------------------------------------------------------------------
// Update own comment
// -----------------------------------------------------------------------------

export async function updateComment(
  authorId: string,
  commentId: string,
  input: UpdateCommentInput,
) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedCommentId = validateUuid(commentId, "comment ID");

  await assertActiveUser(validatedAuthorId);

  const validatedInput = updateCommentSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid comment information.",
      "INVALID_COMMENT_INPUT",
      400,
    );
  }

  const [updatedComment] = await db
    .update(comments)
    .set({
      content: validatedInput.data.content,
    })
    .where(
      and(
        eq(comments.id, validatedCommentId),
        eq(comments.authorId, validatedAuthorId),
        eq(comments.status, "active"),
      ),
    )
    .returning();

  if (!updatedComment) {
    throw new AppError("Comment not found.", "COMMENT_NOT_FOUND", 404);
  }

  return updatedComment;
}

// -----------------------------------------------------------------------------
// Soft-delete own comment
// -----------------------------------------------------------------------------

export async function deleteComment(authorId: string, commentId: string) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedCommentId = validateUuid(commentId, "comment ID");

  // Deliberately no active-account check: an owner should still be able
  // to remove their own comment if their account later becomes inactive.

  const [deletedComment] = await db
    .update(comments)
    .set({
      status: "deleted",
    })
    .where(
      and(
        eq(comments.id, validatedCommentId),
        eq(comments.authorId, validatedAuthorId),
        eq(comments.status, "active"),
      ),
    )
    .returning({
      id: comments.id,
      status: comments.status,
    });

  if (!deletedComment) {
    throw new AppError("Comment not found.", "COMMENT_NOT_FOUND", 404);
  }

  return deletedComment;
}
