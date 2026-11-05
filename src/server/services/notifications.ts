import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { notifications } from "@/db/schema/notifications";
import { profiles } from "@/db/schema/profiles";
import { AppError } from "@/server/errors/app-error";

const uuidSchema = z.string().uuid();

const createNotificationSchema = z
  .object({
    recipientId: uuidSchema,
    actorId: uuidSchema.nullable().optional(),
    notificationType: z.string().trim().min(1).max(50),
    referenceId: uuidSchema,
    referenceType: z.string().trim().min(1).max(50),
  })
  .strict();

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

const notificationOptionsSchema = z
  .object({
    limit: z.number().int().min(1).max(100).default(30),
    offset: z.number().int().min(0).max(100000).default(0),
    unreadOnly: z.boolean().default(false),
  })
  .strict();

async function assertActiveUser(userId: string) {
  const validatedId = uuidSchema.parse(userId);

  const [profile] = await db
    .select({
      id: profiles.id,
      accountStatus: profiles.accountStatus,
    })
    .from(profiles)
    .where(eq(profiles.id, validatedId))
    .limit(1);

  if (!profile || profile.accountStatus !== "active") {
    throw new AppError(
      "An active account is required for this notification operation.",
      "NOTIFICATION_ACCOUNT_INACTIVE",
      403,
    );
  }

  return profile.id;
}

/**
 * Creates a notification.
 *
 * This is an internal server operation.
 * Self-notifications are skipped.
 */
export async function createNotification(input: CreateNotificationInput) {
  const validated = createNotificationSchema.parse(input);

  const [recipient] = await db
    .select({
      id: profiles.id,
      accountStatus: profiles.accountStatus,
    })
    .from(profiles)
    .where(eq(profiles.id, validated.recipientId))
    .limit(1);

  if (!recipient || recipient.accountStatus !== "active") {
    throw new AppError(
      "The notification recipient does not have an active account.",
      "NOTIFICATION_RECIPIENT_INACTIVE",
      403,
    );
  }

  const actorId = validated.actorId ?? null;

  if (actorId === validated.recipientId) {
    return null;
  }

  const [notification] = await db
    .insert(notifications)
    .values({
      recipientId: validated.recipientId,
      actorId,
      notificationType: validated.notificationType,
      referenceId: validated.referenceId,
      referenceType: validated.referenceType,
    })
    .returning();

  return notification;
}

/**
 * Lists notifications belonging to an active user.
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  },
) {
  const validatedUserId = await assertActiveUser(userId);

  const validatedOptions = notificationOptionsSchema.parse(options ?? {});

  const conditions = [eq(notifications.recipientId, validatedUserId)];

  if (validatedOptions.unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(validatedOptions.limit)
    .offset(validatedOptions.offset);
}

/**
 * Returns the unread notification count for an active user.
 */
export async function getUnreadNotificationCount(userId: string) {
  const validatedUserId = await assertActiveUser(userId);

  const [result] = await db
    .select({ total: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientId, validatedUserId),
        eq(notifications.isRead, false),
      ),
    );

  return Number(result?.total ?? 0);
}

/**
 * Marks one notification as read.
 *
 * Only the recipient can update it.
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
) {
  const validatedUserId = await assertActiveUser(userId);
  const validatedNotificationId = uuidSchema.parse(notificationId);

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, validatedNotificationId),
        eq(notifications.recipientId, validatedUserId),
      ),
    )
    .returning({ id: notifications.id });

  return { updated: Boolean(updated) };
}

/**
 * Marks all unread notifications belonging to a user as read.
 */
export async function markAllNotificationsAsRead(userId: string) {
  const validatedUserId = await assertActiveUser(userId);

  const updated = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.recipientId, validatedUserId),
        eq(notifications.isRead, false),
      ),
    )
    .returning({ id: notifications.id });

  return { updatedCount: updated.length };
}

/**
 * Deletes one notification belonging to a user.
 *
 * Does not require an active account, allowing cleanup
 * of notifications after account suspension.
 */
export async function deleteNotification(
  userId: string,
  notificationId: string,
) {
  const validatedUserId = uuidSchema.parse(userId);
  const validatedNotificationId = uuidSchema.parse(notificationId);

  const [deleted] = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, validatedNotificationId),
        eq(notifications.recipientId, validatedUserId),
      ),
    )
    .returning({ id: notifications.id });

  return { deleted: Boolean(deleted) };
}

/**
 * Deletes all notifications belonging to a user.
 *
 * Does not require an active account.
 */
export async function deleteAllNotifications(userId: string) {
  const validatedUserId = uuidSchema.parse(userId);

  const deleted = await db
    .delete(notifications)
    .where(eq(notifications.recipientId, validatedUserId))
    .returning({ id: notifications.id });

  return { deletedCount: deleted.length };
}
