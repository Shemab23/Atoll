import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  profiles,
  profileSettings,
  posts,
  comments,
  messages,
  conversationMembers,
} from "@/db/schema";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const userIdSchema = z.string().uuid();

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]{3,30}$/);

const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),

    displayName: z.string().trim().max(60).nullable().optional(),

    bio: z.string().trim().max(500).nullable().optional(),

    // These fields may contain a URL or a Supabase Storage path.
    // The exact storage convention will be standardized separately.
    avatarUrl: z.string().trim().min(1).max(2048).nullable().optional(),

    coverUrl: z.string().trim().min(1).max(2048).nullable().optional(),

    country: z.string().trim().max(100).nullable().optional(),

    city: z.string().trim().max(100).nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one profile field must be provided.",
  });

const updateProfileSettingsSchema = z
  .object({
    isDiscoverable: z.boolean().optional(),

    showOnlineStatus: z.boolean().optional(),

    allowMessages: z.enum(["everyone", "followers", "nobody"]).optional(),

    // The supported preference keys and values still need a product decision.
    // This currently preserves the existing JSON-based settings structure.
    notificationPreferences: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one settings field must be provided.",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type UpdateProfileSettingsInput = z.infer<
  typeof updateProfileSettingsSchema
>;

// -----------------------------------------------------------------------------
// Shared validation helpers
// -----------------------------------------------------------------------------

function validateUserId(userId: string): string {
  const result = userIdSchema.safeParse(userId);

  if (!result.success) {
    throw new AppError("Invalid user ID.", "INVALID_USER_ID", 400);
  }

  return result.data;
}

function validateUsername(username: string): string {
  const result = usernameSchema.safeParse(username);

  if (!result.success) {
    throw new AppError("Invalid username.", "INVALID_USERNAME", 400);
  }

  return result.data;
}

function getUsernameConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const databaseError = error as {
    code?: unknown;
    constraint?: unknown;
    detail?: unknown;
  };

  if (databaseError.code !== "23505") {
    return false;
  }

  // Do not treat every unique-constraint violation as a username conflict.
  // Only map it when PostgreSQL identifies the username constraint.
  const constraint =
    typeof databaseError.constraint === "string"
      ? databaseError.constraint.toLowerCase()
      : "";

  const detail =
    typeof databaseError.detail === "string"
      ? databaseError.detail.toLowerCase()
      : "";

  return constraint.includes("username") || detail.includes("username");
}

// -----------------------------------------------------------------------------
// Profile retrieval
// -----------------------------------------------------------------------------

/**
 * Retrieves a profile using its ID for public-facing access.
 *
 * Only explicitly selected public fields are returned.
 * Suspended and deleted profiles are not returned.
 *
 * This function does not establish that the profile is discoverable.
 * Discovery queries must separately respect profileSettings.isDiscoverable.
 */
export async function getProfileById(userId: string) {
  const validatedUserId = validateUserId(userId);

  const [profile] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      coverUrl: profiles.coverUrl,
      country: profiles.country,
      city: profiles.city,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(
      and(
        eq(profiles.id, validatedUserId),
        eq(profiles.accountStatus, "active"),
      ),
    )
    .limit(1);

  if (!profile) {
    throw new AppError("Profile not found.", "PROFILE_NOT_FOUND", 404);
  }

  return profile;
}

/**
 * Retrieves the complete profile record for its owner.
 *
 * This includes private fields and must only be called with the
 * authenticated user's ID supplied by trusted server-side code.
 */
export async function getOwnProfileById(userId: string) {
  const validatedUserId = validateUserId(userId);

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, validatedUserId))
    .limit(1);

  if (!profile) {
    throw new AppError("Profile not found.", "PROFILE_NOT_FOUND", 404);
  }

  return profile;
}

/**
 * Retrieves a public profile using its username.
 *
 * This is a direct username lookup, not a discovery query.
 * Discovery must separately enforce profileSettings.isDiscoverable.
 */
export async function getProfileByUsername(username: string) {
  const normalizedUsername = validateUsername(username);

  const [profile] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      coverUrl: profiles.coverUrl,
      country: profiles.country,
      city: profiles.city,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(
      and(
        sql`lower(${profiles.username}) = lower(${normalizedUsername})`,
        eq(profiles.accountStatus, "active"),
      ),
    )
    .limit(1);

  if (!profile) {
    throw new AppError("Profile not found.", "PROFILE_NOT_FOUND", 404);
  }

  return profile;
}

// -----------------------------------------------------------------------------
// Profile updates
// -----------------------------------------------------------------------------

/**
 * Updates a user's own profile.
 *
 * The userId must come from the authenticated server-side session.
 * Never pass an untrusted request-body user ID directly into this function.
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const validatedUserId = validateUserId(userId);
  const validatedInput = updateProfileSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid profile information.",
      "INVALID_PROFILE_INPUT",
      400,
    );
  }

  try {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        ...validatedInput.data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, validatedUserId))
      .returning({
        id: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        coverUrl: profiles.coverUrl,
        country: profiles.country,
        city: profiles.city,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      });

    if (!updatedProfile) {
      throw new AppError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    return updatedProfile;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (getUsernameConflict(error)) {
      throw new AppError(
        "That username is already taken.",
        "USERNAME_ALREADY_TAKEN",
        409,
      );
    }

    throw error;
  }
}

// -----------------------------------------------------------------------------
// Profile settings retrieval
// -----------------------------------------------------------------------------

/**
 * Retrieves profile settings.
 *
 * The userId must belong to the authenticated user.
 * The API controller must enforce this ownership requirement.
 */
export async function getProfileSettings(userId: string) {
  const validatedUserId = validateUserId(userId);

  const [settings] = await db
    .select()
    .from(profileSettings)
    .where(eq(profileSettings.userId, validatedUserId))
    .limit(1);

  if (!settings) {
    throw new AppError(
      "Profile settings not found.",
      "PROFILE_SETTINGS_NOT_FOUND",
      404,
    );
  }

  return settings;
}

// -----------------------------------------------------------------------------
// Profile settings updates
// -----------------------------------------------------------------------------

/**
 * Updates profile settings.
 *
 * Only supplied fields are updated.
 * notificationPreferences replaces the existing JSON object when supplied;
 * it is not merged automatically.
 *
 * The userId must come from the authenticated server-side session.
 */
export async function updateProfileSettings(
  userId: string,
  input: UpdateProfileSettingsInput,
) {
  const validatedUserId = validateUserId(userId);
  const validatedInput = updateProfileSettingsSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError(
      "Invalid profile settings.",
      "INVALID_PROFILE_SETTINGS",
      400,
    );
  }

  const [updatedSettings] = await db
    .update(profileSettings)
    .set({
      ...validatedInput.data,
      updatedAt: new Date(),
    })
    .where(eq(profileSettings.userId, validatedUserId))
    .returning();

  if (!updatedSettings) {
    throw new AppError(
      "Profile settings not found.",
      "PROFILE_SETTINGS_NOT_FOUND",
      404,
    );
  }

  return updatedSettings;
}

export async function softDeleteProfile(userId: string) {
  const deletedAt = new Date();

  const reservedUsername = `deleted_${userId.replace(/-/g, "").slice(0, 22)}`;

  await db.transaction(async (tx) => {
    const [profile] = await tx
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      throw new AppError("Profile not found.", "PROFILE_NOT_FOUND", 404);
    }

    await tx
      .update(posts)
      .set({
        status: "deleted",
        updatedAt: deletedAt,
      })
      .where(eq(posts.authorId, userId));

    await tx
      .update(comments)
      .set({ status: "deleted" })
      .where(eq(comments.authorId, userId));

    await tx
      .update(messages)
      .set({
        content: null,
        deletedAt: sql`COALESCE(${messages.deletedAt}, ${deletedAt})`,
      })
      .where(eq(messages.senderId, userId));

    await tx
      .update(conversationMembers)
      .set({ isActive: false })
      .where(eq(conversationMembers.userId, userId));

    await tx
      .update(profileSettings)
      .set({
        isDiscoverable: false,
        showOnlineStatus: false,
        allowMessages: "nobody",
      })
      .where(eq(profileSettings.userId, userId));

    await tx
      .update(profiles)
      .set({
        username: reservedUsername,
        displayName: "Deleted account",
        bio: null,
        country: null,
        city: null,
        accountStatus: "deleted",
        updatedAt: deletedAt,
      })
      .where(eq(profiles.id, userId));
  });

  return {
    userId,
    accountStatus: "deleted" as const,
  };
} // leaving follows, blocks, reactions, notifications, reports, moderation records, and admin records untouch[no soft delete yet]
