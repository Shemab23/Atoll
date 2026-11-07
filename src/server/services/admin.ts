import "server-only";

import { count, desc, eq, ilike, or, and } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { adminUsers, profiles, moderationActions, reports } from "@/db/schema";
import { AppError } from "@/server/errors/app-error";

export type AdminRole = "owner" | "admin" | "moderator";

export type ModerationActionType = "warning" | "hide" | "suspend" | "ban";

const userIdSchema = z.string().uuid();

const grantAdminRoleSchema = z
  .object({
    userId: userIdSchema,
    role: z.enum(["admin", "moderator"]),
  })
  .strict();

const moderationActionSchema = z.enum(["warning", "hide", "suspend", "ban"]);

/**
 * Returns a user's administrative role.
 * No admin_users record means the user is a regular user.
 */
export async function getAdminRole(userId: string): Promise<AdminRole | null> {
  const validatedUserId = userIdSchema.parse(userId);

  const [result] = await db
    .select({ role: adminUsers.role })
    .from(adminUsers)
    .where(eq(adminUsers.userId, validatedUserId))
    .limit(1);

  return result?.role ?? null;
}

/**
 * Requires an active user with an administrative role.
 */
export async function requireAdmin(userId: string): Promise<AdminRole> {
  const validatedUserId = userIdSchema.parse(userId);

  const [result] = await db
    .select({
      role: adminUsers.role,
      accountStatus: profiles.accountStatus,
    })
    .from(adminUsers)
    .innerJoin(profiles, eq(adminUsers.userId, profiles.id))
    .where(eq(adminUsers.userId, validatedUserId))
    .limit(1);

  if (!result) {
    throw new AppError(
      "Administrative access is required.",
      "ADMIN_ACCESS_REQUIRED",
      403,
    );
  }

  if (result.accountStatus !== "active") {
    throw new AppError(
      "Your account cannot perform administrative actions.",
      "ADMIN_ACCOUNT_INACTIVE",
      403,
    );
  }

  return result.role;
}

/**
 * Requires the platform owner.
 */
export async function requireOwner(userId: string): Promise<void> {
  const role = await requireAdmin(userId);

  if (role !== "owner") {
    throw new AppError(
      "Only the platform owner can perform this operation.",
      "OWNER_ACCESS_REQUIRED",
      403,
    );
  }
}

/**
 * Requires permission to review reports.
 * All three administrative roles can review reports.
 */
export async function requireReportAccess(userId: string): Promise<AdminRole> {
  return requireAdmin(userId);
}

/**
 * Checks whether an admin role can perform a particular
 * moderation action.
 *
 * Owner: all actions.
 * Admin: all actions.
 * Moderator: warning and hide only.
 */
export async function requireModerationPermission(
  userId: string,
  actionType: ModerationActionType,
): Promise<AdminRole> {
  const validatedAction = moderationActionSchema.parse(actionType);
  const role = await requireAdmin(userId);

  if (
    role === "moderator" &&
    validatedAction !== "warning" &&
    validatedAction !== "hide"
  ) {
    throw new AppError(
      "Moderators can only issue warnings and hide content.",
      "INSUFFICIENT_MODERATION_PERMISSION",
      403,
    );
  }

  return role;
}

/**
 * Lists all administrators.
 * Owner only.
 */
export async function getAdminUsers(actorId: string) {
  await requireOwner(actorId);

  return db
    .select({
      id: adminUsers.id,
      userId: adminUsers.userId,
      role: adminUsers.role,
      grantedBy: adminUsers.grantedBy,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
      username: profiles.username,
      displayName: profiles.displayName,
      accountStatus: profiles.accountStatus,
    })
    .from(adminUsers)
    .innerJoin(profiles, eq(adminUsers.userId, profiles.id))
    .orderBy(desc(adminUsers.createdAt));
}

/**
 * Grants or changes an admin/moderator role.
 * Owner only. Ownership cannot be granted or changed here.
 */
export async function grantAdminRole(
  actorId: string,
  input: z.infer<typeof grantAdminRoleSchema>,
) {
  const validatedActorId = userIdSchema.parse(actorId);
  const validated = grantAdminRoleSchema.parse(input);

  if (validated.userId === validatedActorId) {
    throw new AppError(
      "You cannot change your own role.",
      "CANNOT_CHANGE_OWN_ROLE",
      400,
    );
  }

  return db.transaction(async (tx) => {
    // Recheck and lock the acting administrator's role.
    const [actor] = await tx
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.userId, validatedActorId))
      .for("update")
      .limit(1);

    if (!actor || actor.role !== "owner") {
      throw new AppError(
        "Only the platform owner can perform this operation.",
        actor ? "OWNER_ACCESS_REQUIRED" : "ADMIN_ACCESS_REQUIRED",
        403,
      );
    }

    // Confirm the owner account is still active.
    const [actorProfile] = await tx
      .select({ accountStatus: profiles.accountStatus })
      .from(profiles)
      .where(eq(profiles.id, validatedActorId))
      .limit(1);

    if (!actorProfile || actorProfile.accountStatus !== "active") {
      throw new AppError(
        "Your account cannot perform administrative actions.",
        "ADMIN_ACCOUNT_INACTIVE",
        403,
      );
    }

    // Lock the target profile while checking eligibility.
    const [targetProfile] = await tx
      .select({
        id: profiles.id,
        accountStatus: profiles.accountStatus,
      })
      .from(profiles)
      .where(eq(profiles.id, validated.userId))
      .for("update")
      .limit(1);

    if (!targetProfile) {
      throw new AppError(
        "The selected user does not exist.",
        "PROFILE_NOT_FOUND",
        404,
      );
    }

    if (targetProfile.accountStatus !== "active") {
      throw new AppError(
        "An inactive user cannot be given an administrative role.",
        "TARGET_ACCOUNT_INACTIVE",
        400,
      );
    }

    const [existing] = await tx
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.userId, validated.userId))
      .limit(1);

    if (existing?.role === "owner") {
      throw new AppError(
        "The owner role cannot be changed here.",
        "OWNER_ROLE_PROTECTED",
        403,
      );
    }

    if (existing) {
      const [updated] = await tx
        .update(adminUsers)
        .set({
          role: validated.role,
          grantedBy: validatedActorId,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.userId, validated.userId))
        .returning();

      return updated;
    }

    const [created] = await tx
      .insert(adminUsers)
      .values({
        userId: validated.userId,
        role: validated.role,
        grantedBy: validatedActorId,
      })
      .returning();

    return created;
  });
}

/**
 * Removes an admin or moderator role.
 * Owner only. The owner record is protected.
 */
export async function revokeAdminRole(actorId: string, targetUserId: string) {
  const validatedActorId = userIdSchema.parse(actorId);
  const validatedTargetId = userIdSchema.parse(targetUserId);

  if (validatedTargetId === validatedActorId) {
    throw new AppError(
      "You cannot remove your own role.",
      "CANNOT_REMOVE_OWN_ROLE",
      400,
    );
  }

  return db.transaction(async (tx) => {
    // Recheck and lock the acting administrator's role.
    const [actor] = await tx
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.userId, validatedActorId))
      .for("update")
      .limit(1);

    if (!actor || actor.role !== "owner") {
      throw new AppError(
        "Only the platform owner can perform this operation.",
        actor ? "OWNER_ACCESS_REQUIRED" : "ADMIN_ACCESS_REQUIRED",
        403,
      );
    }

    // Confirm the owner account is still active.
    const [actorProfile] = await tx
      .select({ accountStatus: profiles.accountStatus })
      .from(profiles)
      .where(eq(profiles.id, validatedActorId))
      .limit(1);

    if (!actorProfile || actorProfile.accountStatus !== "active") {
      throw new AppError(
        "Your account cannot perform administrative actions.",
        "ADMIN_ACCOUNT_INACTIVE",
        403,
      );
    }

    const [target] = await tx
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.userId, validatedTargetId))
      .for("update")
      .limit(1);

    if (!target) {
      throw new AppError(
        "This user does not have an administrative role.",
        "ADMIN_NOT_FOUND",
        404,
      );
    }

    if (target.role === "owner") {
      throw new AppError(
        "The platform owner cannot be removed.",
        "OWNER_ROLE_PROTECTED",
        403,
      );
    }

    await tx.delete(adminUsers).where(eq(adminUsers.userId, validatedTargetId));

    return { success: true };
  });
}

export type AdminUserListOptions = {
  limit?: number;
  offset?: number;
  search?: string;
  accountStatus?: "active" | "suspended" | "deleted";
};

export async function getAdminOverview(actorId: string) {
  await requireReportAccess(actorId);

  const [
    [totalUsers],
    [activeUsers],
    [suspendedUsers],
    [totalReports],
    [pendingReports],
    [reviewingReports],
    [totalModerationActions],
    [totalAdministrators],
  ] = await Promise.all([
    db.select({ value: count() }).from(profiles),
    db
      .select({ value: count() })
      .from(profiles)
      .where(eq(profiles.accountStatus, "active")),
    db
      .select({ value: count() })
      .from(profiles)
      .where(eq(profiles.accountStatus, "suspended")),
    db.select({ value: count() }).from(reports),
    db
      .select({ value: count() })
      .from(reports)
      .where(eq(reports.status, "pending")),
    db
      .select({ value: count() })
      .from(reports)
      .where(eq(reports.status, "reviewing")),
    db.select({ value: count() }).from(moderationActions),
    db.select({ value: count() }).from(adminUsers),
  ]);

  return {
    users: {
      total: totalUsers.value,
      active: activeUsers.value,
      suspended: suspendedUsers.value,
    },
    reports: {
      total: totalReports.value,
      pending: pendingReports.value,
      reviewing: reviewingReports.value,
    },
    moderation: {
      totalActions: totalModerationActions.value,
    },
    administrators: {
      total: totalAdministrators.value,
    },
  };
}

export async function getUsers(
  actorId: string,
  options: AdminUserListOptions = {},
) {
  await requireReportAccess(actorId);

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const search = options.search?.trim();

  const filters = [];

  if (options.accountStatus) {
    filters.push(eq(profiles.accountStatus, options.accountStatus));
  }

  if (search) {
    filters.push(
      or(
        ilike(profiles.username, `%${search}%`),
        ilike(profiles.displayName, `%${search}%`),
      )!,
    );
  }

  const whereClause =
    filters.length > 0
      ? filters.length === 1
        ? filters[0]
        : and(...filters)
      : undefined;

  const [users, [total]] = await Promise.all([
    db
      .select({
        id: profiles.id,
        username: profiles.username,
        displayName: profiles.displayName,
        accountStatus: profiles.accountStatus,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(whereClause)
      .orderBy(desc(profiles.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ value: count() }).from(profiles).where(whereClause),
  ]);

  return {
    users,
    pagination: {
      total: total.value,
      limit,
      offset,
      hasMore: offset + users.length < total.value,
    },
  };
}

export async function getUserById(actorId: string, targetUserId: string) {
  await requireReportAccess(actorId);

  const [user] = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      dateOfBirth: profiles.dateOfBirth,
      bio: profiles.bio,
      avatarUrl: profiles.avatarUrl,
      coverUrl: profiles.coverUrl,
      country: profiles.country,
      city: profiles.city,
      accountStatus: profiles.accountStatus,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .where(eq(profiles.id, targetUserId))
    .limit(1);

  if (!user) {
    throw new AppError("User not found.", "USER_NOT_FOUND", 404);
  }

  return user;
}
