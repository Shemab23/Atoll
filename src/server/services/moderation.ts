import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  adminUsers,
  comments,
  messages,
  moderationActions,
  posts,
  profiles,
  reports,
} from "@/db/schema";
import { AppError } from "@/server/errors/app-error";

const userIdSchema = z.string().uuid();

const moderationInputSchema = z
  .object({
    reportId: z.string().uuid(),
    actionType: z.enum(["warning", "hide", "suspend", "ban"]),
    reason: z.string().trim().min(3).max(1000),
    expiresAt: z.coerce.date().nullable().optional(),
  })
  .strict();

export type ApplyModerationInput = z.infer<typeof moderationInputSchema>;

const paginationSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).max(100000).default(0),
  })
  .strict();

type ModerationRole = "owner" | "admin" | "moderator";

/**
 * Applies a moderation action to the target of a report.
 *
 * warning: records a warning.
 * hide: hides a post/comment or removes a message from normal display.
 * suspend: suspends an account, optionally recording an expiry date.
 * ban: suspends an account without an expiry date.
 *
 * The action record, target change, and report status update
 * are performed in one transaction.
 */
export async function applyModerationAction(
  actorId: string,
  input: ApplyModerationInput,
) {
  const validatedActorId = userIdSchema.parse(actorId);
  const validated = moderationInputSchema.parse(input);

  if (validated.actionType !== "suspend" && validated.expiresAt) {
    throw new AppError(
      "An expiry date can only be used for a suspension.",
      "INVALID_MODERATION_EXPIRY",
      400,
    );
  }

  if (validated.expiresAt && validated.expiresAt.getTime() <= Date.now()) {
    throw new AppError(
      "The suspension expiry must be in the future.",
      "INVALID_MODERATION_EXPIRY",
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

    if (!actor) {
      throw new AppError(
        "Administrative access is required.",
        "ADMIN_ACCESS_REQUIRED",
        403,
      );
    }

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

    const actorRole = actor.role as ModerationRole;

    if (
      actorRole === "moderator" &&
      validated.actionType !== "warning" &&
      validated.actionType !== "hide"
    ) {
      throw new AppError(
        "Moderators can only issue warnings and hide content.",
        "INSUFFICIENT_MODERATION_PERMISSION",
        403,
      );
    }

    // Lock the report so two administrators cannot process
    // the same report concurrently.
    const [report] = await tx
      .select()
      .from(reports)
      .where(eq(reports.id, validated.reportId))
      .for("update")
      .limit(1);

    if (!report) {
      throw new AppError("Report not found.", "REPORT_NOT_FOUND", 404);
    }

    if (report.status === "resolved" || report.status === "dismissed") {
      throw new AppError(
        "This report has already been closed.",
        "REPORT_ALREADY_CLOSED",
        409,
      );
    }

    // Normally createReport() already stores reportedUserId.
    // The fallback supports older reports where it is null.
    let targetUserId = report.reportedUserId;

    if (!targetUserId && report.postId) {
      const [post] = await tx
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, report.postId))
        .limit(1);

      targetUserId = post?.authorId ?? null;
    }

    if (!targetUserId && report.commentId) {
      const [comment] = await tx
        .select({ authorId: comments.authorId })
        .from(comments)
        .where(eq(comments.id, report.commentId))
        .limit(1);

      targetUserId = comment?.authorId ?? null;
    }

    if (!targetUserId && report.messageId) {
      const [message] = await tx
        .select({ senderId: messages.senderId })
        .from(messages)
        .where(eq(messages.id, report.messageId))
        .limit(1);

      targetUserId = message?.senderId ?? null;
    }

    if (!targetUserId) {
      throw new AppError(
        "The reported user could not be identified.",
        "REPORTED_USER_NOT_FOUND",
        404,
      );
    }

    if (targetUserId === validatedActorId) {
      throw new AppError(
        "You cannot moderate your own account or content.",
        "CANNOT_MODERATE_SELF",
        403,
      );
    }

    // Protect administrative accounts.
    // Lock the target admin record while checking its role.
    const [targetAdmin] = await tx
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(eq(adminUsers.userId, targetUserId))
      .for("update")
      .limit(1);

    if (
      targetAdmin?.role === "owner" ||
      (targetAdmin && actorRole !== "owner")
    ) {
      throw new AppError(
        "You do not have permission to moderate this administrator.",
        "ADMIN_TARGET_PROTECTED",
        403,
      );
    }

    // Apply the actual moderation action.
    if (validated.actionType === "hide") {
      if (report.postId) {
        const [hiddenPost] = await tx
          .update(posts)
          .set({
            status: "hidden",
            updatedAt: new Date(),
          })
          .where(eq(posts.id, report.postId))
          .returning({ id: posts.id });

        if (!hiddenPost) {
          throw new AppError(
            "The reported post no longer exists.",
            "REPORTED_CONTENT_NOT_FOUND",
            404,
          );
        }
      } else if (report.commentId) {
        const [hiddenComment] = await tx
          .update(comments)
          .set({ status: "hidden" })
          .where(eq(comments.id, report.commentId))
          .returning({ id: comments.id });

        if (!hiddenComment) {
          throw new AppError(
            "The reported comment no longer exists.",
            "REPORTED_CONTENT_NOT_FOUND",
            404,
          );
        }
      } else if (report.messageId) {
        const [hiddenMessage] = await tx
          .update(messages)
          .set({
            deletedAt: new Date(),
            content: null,
            mediaPath: null,
          })
          .where(
            and(eq(messages.id, report.messageId), isNull(messages.deletedAt)),
          )
          .returning({ id: messages.id });

        if (!hiddenMessage) {
          throw new AppError(
            "The reported message no longer exists or is already removed.",
            "REPORTED_CONTENT_NOT_FOUND",
            404,
          );
        }
      } else {
        throw new AppError(
          "This report has no supported content target to hide.",
          "INVALID_HIDE_TARGET",
          400,
        );
      }
    }

    if (validated.actionType === "suspend" || validated.actionType === "ban") {
      const [suspendedProfile] = await tx
        .update(profiles)
        .set({
          accountStatus: "suspended",
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, targetUserId))
        .returning({ id: profiles.id });

      if (!suspendedProfile) {
        throw new AppError(
          "The reported account no longer exists.",
          "REPORTED_USER_NOT_FOUND",
          404,
        );
      }
    }

    // Save the moderation audit record.
    const [action] = await tx
      .insert(moderationActions)
      .values({
        adminId: validatedActorId,
        targetUserId,
        reportId: report.id,
        actionType: validated.actionType,
        reason: validated.reason,
        expiresAt:
          validated.actionType === "suspend"
            ? (validated.expiresAt ?? null)
            : null,
      })
      .returning();

    // Resolve the report after the action succeeds.
    await tx
      .update(reports)
      .set({ status: "resolved" })
      .where(eq(reports.id, report.id));

    return action;
  });
}

/**
 * Lists moderation actions.
 * Accessible to all administrative roles.
 */
export async function getModerationActions(
  actorId: string,
  options?: {
    limit?: number;
    offset?: number;
  },
) {
  const validatedActorId = userIdSchema.parse(actorId);
  const pagination = paginationSchema.parse(options ?? {});

  // Warning is the least privileged moderation permission.
  await requireActiveModerationViewer(validatedActorId);

  return db
    .select()
    .from(moderationActions)
    .orderBy(desc(moderationActions.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

/**
 * Gets the moderation history of a particular user.
 * Accessible to all administrative roles.
 */
export async function getUserModerationHistory(
  actorId: string,
  targetUserId: string,
  options?: {
    limit?: number;
    offset?: number;
  },
) {
  const validatedActorId = userIdSchema.parse(actorId);
  const validatedTargetId = userIdSchema.parse(targetUserId);
  const pagination = paginationSchema.parse(options ?? {});

  await requireActiveModerationViewer(validatedActorId);

  return db
    .select()
    .from(moderationActions)
    .where(eq(moderationActions.targetUserId, validatedTargetId))
    .orderBy(desc(moderationActions.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);
}

/**
 * Requires an active administrative account.
 * All three roles can view moderation history.
 */
async function requireActiveModerationViewer(
  actorId: string,
): Promise<ModerationRole> {
  const [result] = await db
    .select({
      role: adminUsers.role,
      accountStatus: profiles.accountStatus,
    })
    .from(adminUsers)
    .innerJoin(profiles, eq(adminUsers.userId, profiles.id))
    .where(eq(adminUsers.userId, actorId))
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
