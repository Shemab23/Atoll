import "server-only";

import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { blocks } from "@/db/schema/reaction";
import { follows } from "@/db/schema";
import { profiles } from "@/db/schema/profiles";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const blockUserSchema = z
  .object({
    userId: uuidSchema,
  })
  .strict();

function validateUuid(value: string, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(`Invalid ${fieldName}.`, "INVALID_USER_ID", 400);
  }

  return result.data;
}

// -----------------------------------------------------------------------------
// Account checks
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

// -----------------------------------------------------------------------------
// Block relationship checks
// -----------------------------------------------------------------------------

/**
 * Checks whether either user has blocked the other.
 */
export async function hasBlockBetweenUsers(
  firstUserId: string,
  secondUserId: string,
): Promise<boolean> {
  const validatedFirstId = validateUuid(firstUserId, "first user ID");
  const validatedSecondId = validateUuid(secondUserId, "second user ID");

  const [relationship] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(
          eq(blocks.blockerId, validatedFirstId),
          eq(blocks.blockedId, validatedSecondId),
        ),
        and(
          eq(blocks.blockerId, validatedSecondId),
          eq(blocks.blockedId, validatedFirstId),
        ),
      ),
    )
    .limit(1);

  return Boolean(relationship);
}

/**
 * Checks whether one specific user has blocked another.
 */
export async function hasUserBlocked(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const validatedBlockerId = validateUuid(blockerId, "blocker ID");
  const validatedBlockedId = validateUuid(blockedId, "blocked user ID");

  const [relationship] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      and(
        eq(blocks.blockerId, validatedBlockerId),
        eq(blocks.blockedId, validatedBlockedId),
      ),
    )
    .limit(1);

  return Boolean(relationship);
}

// -----------------------------------------------------------------------------
// Block a user
// -----------------------------------------------------------------------------

/**
 * Blocks another user and removes existing follow relationships
 * in both directions.
 */
export async function blockUser(
  blockerId: string,
  input: z.infer<typeof blockUserSchema>,
) {
  const validatedBlockerId = validateUuid(blockerId, "blocker ID");
  const validatedInput = blockUserSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError("Invalid block target.", "INVALID_BLOCK_TARGET", 400);
  }

  const blockedId = validatedInput.data.userId;

  if (validatedBlockerId === blockedId) {
    throw new AppError(
      "You cannot block yourself.",
      "INVALID_BLOCK_TARGET",
      400,
    );
  }

  await assertActiveUser(validatedBlockerId);

  const [target] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, blockedId))
    .limit(1);

  if (!target) {
    throw new AppError("User not found.", "USER_NOT_FOUND", 404);
  }

  return db.transaction(async (tx) => {
    // Remove any existing follow relationship in either direction.
    // These changes and the block insertion succeed or fail together.
    await tx
      .delete(follows)
      .where(
        or(
          and(
            eq(follows.followerId, validatedBlockerId),
            eq(follows.followingId, blockedId),
          ),
          and(
            eq(follows.followerId, blockedId),
            eq(follows.followingId, validatedBlockerId),
          ),
        ),
      );

    const [relationship] = await tx
      .insert(blocks)
      .values({
        blockerId: validatedBlockerId,
        blockedId,
      })
      .onConflictDoNothing({
        target: [blocks.blockerId, blocks.blockedId],
      })
      .returning();

    return {
      blocked: true,
      created: Boolean(relationship),
    };
  });
}

// -----------------------------------------------------------------------------
// Unblock a user
// -----------------------------------------------------------------------------

/**
 * Removes a block created by the specified user.
 *
 * This operation intentionally does not require an active account.
 * It must remain possible to remove a block after account restrictions
 * or other relationship changes.
 */
export async function unblockUser(blockerId: string, blockedId: string) {
  const validatedBlockerId = validateUuid(blockerId, "blocker ID");
  const validatedBlockedId = validateUuid(blockedId, "blocked user ID");

  const [removed] = await db
    .delete(blocks)
    .where(
      and(
        eq(blocks.blockerId, validatedBlockerId),
        eq(blocks.blockedId, validatedBlockedId),
      ),
    )
    .returning({ id: blocks.id });

  return {
    unblocked: Boolean(removed),
  };
}

// -----------------------------------------------------------------------------
// Get blocked users
// -----------------------------------------------------------------------------

/**
 * Lists users blocked by the specified user.
 */
export async function getBlockedUsers(userId: string) {
  const validatedUserId = validateUuid(userId, "user ID");

  await assertActiveUser(validatedUserId);

  return db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      blockedAt: blocks.createdAt,
    })
    .from(blocks)
    .innerJoin(profiles, eq(profiles.id, blocks.blockedId))
    .where(eq(blocks.blockerId, validatedUserId))
    .orderBy(desc(blocks.createdAt));
}
