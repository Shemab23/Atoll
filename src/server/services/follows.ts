import "server-only";

import { and, count, desc, eq, notExists, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { blocks, follows, profiles } from "@/db/schema";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const paginationSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).max(100000).default(0),
  })
  .strict();

function validateUuid(value: string, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(`Invalid ${fieldName}.`, "INVALID_USER_ID", 400);
  }

  return result.data;
}

function validatePagination(limit: number, offset: number) {
  const result = paginationSchema.safeParse({ limit, offset });

  if (!result.success) {
    throw new AppError(
      "Invalid pagination options.",
      "INVALID_FOLLOW_PAGINATION",
      400,
    );
  }

  return result.data;
}

// -----------------------------------------------------------------------------
// Account and block checks
// -----------------------------------------------------------------------------

async function isActiveUser(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, userId), eq(profiles.accountStatus, "active")))
    .limit(1);

  return Boolean(user);
}

async function assertActiveUser(userId: string) {
  if (!(await isActiveUser(userId))) {
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
  const [block] = await db
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

  return Boolean(block);
}

async function assertNoBlockBetweenUsers(
  firstUserId: string,
  secondUserId: string,
) {
  if (await hasBlockBetweenUsers(firstUserId, secondUserId)) {
    throw new AppError(
      "You cannot follow this user.",
      "INTERACTION_BLOCKED",
      403,
    );
  }
}

// -----------------------------------------------------------------------------
// Shared block-aware relationship filter
// -----------------------------------------------------------------------------

function noBlockBetweenUsers(viewerId: string) {
  return notExists(
    db
      .select({ id: blocks.id })
      .from(blocks)
      .where(
        or(
          and(
            eq(blocks.blockerId, viewerId),
            eq(blocks.blockedId, profiles.id),
          ),
          and(
            eq(blocks.blockerId, profiles.id),
            eq(blocks.blockedId, viewerId),
          ),
        ),
      ),
  );
}

// -----------------------------------------------------------------------------
// Follow a user
// -----------------------------------------------------------------------------

export async function followUser(followerId: string, targetUserId: string) {
  const validatedFollowerId = validateUuid(followerId, "follower ID");
  const validatedTargetId = validateUuid(targetUserId, "target user ID");

  if (validatedFollowerId === validatedTargetId) {
    throw new AppError(
      "You cannot follow yourself.",
      "CANNOT_FOLLOW_SELF",
      400,
    );
  }

  await assertActiveUser(validatedFollowerId);

  const targetIsActive = await isActiveUser(validatedTargetId);

  if (!targetIsActive) {
    throw new AppError("User not found.", "USER_NOT_FOUND", 404);
  }

  await assertNoBlockBetweenUsers(validatedFollowerId, validatedTargetId);

  const [existingFollow] = await db
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, validatedFollowerId),
        eq(follows.followingId, validatedTargetId),
      ),
    )
    .limit(1);

  if (existingFollow) {
    return existingFollow;
  }

  const [newFollow] = await db
    .insert(follows)
    .values({
      followerId: validatedFollowerId,
      followingId: validatedTargetId,
    })
    .onConflictDoNothing({
      target: [follows.followerId, follows.followingId],
    })
    .returning();

  if (newFollow) {
    return newFollow;
  }

  // Another request may have created the relationship concurrently.
  const [concurrentFollow] = await db
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, validatedFollowerId),
        eq(follows.followingId, validatedTargetId),
      ),
    )
    .limit(1);

  if (!concurrentFollow) {
    throw new AppError("Unable to follow this user.", "FOLLOW_FAILED", 500);
  }

  return concurrentFollow;
}

// -----------------------------------------------------------------------------
// Unfollow a user
// -----------------------------------------------------------------------------

export async function unfollowUser(followerId: string, targetUserId: string) {
  const validatedFollowerId = validateUuid(followerId, "follower ID");
  const validatedTargetId = validateUuid(targetUserId, "target user ID");

  // This operation intentionally does not require active accounts or
  // an unblocked relationship. It must remain possible to remove an
  // existing follow after an account is suspended or a block is created.
  const [deletedFollow] = await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, validatedFollowerId),
        eq(follows.followingId, validatedTargetId),
      ),
    )
    .returning({
      id: follows.id,
      followingId: follows.followingId,
    });

  return {
    unfollowed: Boolean(deletedFollow),
    relationship: deletedFollow ?? null,
  };
}

// -----------------------------------------------------------------------------
// Check follow relationship
// -----------------------------------------------------------------------------

export async function isFollowing(followerId: string, targetUserId: string) {
  const validatedFollowerId = validateUuid(followerId, "follower ID");
  const validatedTargetId = validateUuid(targetUserId, "target user ID");

  await assertActiveUser(validatedFollowerId);

  if (!(await isActiveUser(validatedTargetId))) {
    return false;
  }

  if (await hasBlockBetweenUsers(validatedFollowerId, validatedTargetId)) {
    return false;
  }

  const [relationship] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, validatedFollowerId),
        eq(follows.followingId, validatedTargetId),
      ),
    )
    .limit(1);

  return Boolean(relationship);
}

// -----------------------------------------------------------------------------
// Get followers
// -----------------------------------------------------------------------------

export async function getFollowers(userId: string, limit = 50, offset = 0) {
  const validatedUserId = validateUuid(userId, "user ID");
  const pagination = validatePagination(limit, offset);

  await assertActiveUser(validatedUserId);

  return db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(profiles, eq(follows.followerId, profiles.id))
    .where(
      and(
        eq(follows.followingId, validatedUserId),
        eq(profiles.accountStatus, "active"),
        noBlockBetweenUsers(validatedUserId),
      ),
    )
    .orderBy(desc(follows.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

// -----------------------------------------------------------------------------
// Get following
// -----------------------------------------------------------------------------

export async function getFollowing(userId: string, limit = 50, offset = 0) {
  const validatedUserId = validateUuid(userId, "user ID");
  const pagination = validatePagination(limit, offset);

  await assertActiveUser(validatedUserId);

  return db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      followedAt: follows.createdAt,
    })
    .from(follows)
    .innerJoin(profiles, eq(follows.followingId, profiles.id))
    .where(
      and(
        eq(follows.followerId, validatedUserId),
        eq(profiles.accountStatus, "active"),
        noBlockBetweenUsers(validatedUserId),
      ),
    )
    .orderBy(desc(follows.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

// -----------------------------------------------------------------------------
// Get follower and following counts
// -----------------------------------------------------------------------------

export async function getFollowCounts(userId: string) {
  const validatedUserId = validateUuid(userId, "user ID");

  await assertActiveUser(validatedUserId);

  const [followersResult] = await db
    .select({ total: count() })
    .from(follows)
    .innerJoin(profiles, eq(follows.followerId, profiles.id))
    .where(
      and(
        eq(follows.followingId, validatedUserId),
        eq(profiles.accountStatus, "active"),
        noBlockBetweenUsers(validatedUserId),
      ),
    );

  const [followingResult] = await db
    .select({ total: count() })
    .from(follows)
    .innerJoin(profiles, eq(follows.followingId, profiles.id))
    .where(
      and(
        eq(follows.followerId, validatedUserId),
        eq(profiles.accountStatus, "active"),
        noBlockBetweenUsers(validatedUserId),
      ),
    );

  return {
    followers: Number(followersResult.total),
    following: Number(followingResult.total),
  };
}
