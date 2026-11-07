import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { comments, follows } from "@/db/schema/actions";
import { messages } from "@/db/schema/messages";
import { profiles } from "@/db/schema/profiles";
import { posts } from "@/db/schema/posts";
import { reports } from "@/db/schema/reaction";
import { AppError } from "@/server/errors/app-error";
import { isConversationMember } from "@/server/services/conversations";
import { requireReportAccess } from "@/server/services/admin";

const uuidSchema = z.string().uuid();

const reportInputSchema = z.discriminatedUnion("targetType", [
  z
    .object({
      targetType: z.literal("post"),
      targetId: uuidSchema,
      reason: z.string().trim().min(2).max(80),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),

  z
    .object({
      targetType: z.literal("comment"),
      targetId: uuidSchema,
      reason: z.string().trim().min(2).max(80),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),

  z
    .object({
      targetType: z.literal("message"),
      targetId: uuidSchema,
      reason: z.string().trim().min(2).max(80),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),
]);

export type CreateReportInput = z.infer<typeof reportInputSchema>;

// Statuses that administrators can assign.
export type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

// All possible statuses, including reporter withdrawal.
export type ReportListStatus = ReportStatus | "withdrawn";

const reportStatusSchema = z.enum([
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
  "withdrawn",
]);

const adminReportStatusSchema = z.enum([
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

const reportListOptionsSchema = z
  .object({
    status: reportStatusSchema.optional(),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).max(100000).default(0),
  })
  .strict();

async function assertActiveReporter(reporterId: string) {
  const validatedId = uuidSchema.parse(reporterId);

  const [reporter] = await db
    .select({
      id: profiles.id,
      accountStatus: profiles.accountStatus,
    })
    .from(profiles)
    .where(eq(profiles.id, validatedId))
    .limit(1);

  if (!reporter || reporter.accountStatus !== "active") {
    throw new AppError(
      "An active account is required to submit a report.",
      "REPORTER_ACCOUNT_INACTIVE",
      403,
    );
  }

  return reporter.id;
}

/**
 * Checks whether a user can access a post.
 * The post must be active and either public, owned by the viewer,
 * or visible to followers where the viewer follows the author.
 *
 * Blocking is deliberately not checked here:
 * users must still be able to report content from people they blocked.
 */
async function assertCanAccessPost(viewerId: string, postId: string) {
  const [post] = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      visibility: posts.visibility,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.status, "active")))
    .limit(1);

  if (!post) {
    throw new AppError("Post not found.", "POST_NOT_FOUND", 404);
  }

  if (post.authorId === viewerId || post.visibility === "public") {
    return post;
  }

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
      "You cannot report content from a post you cannot access.",
      "FORBIDDEN",
      403,
    );
  }

  return post;
}

/**
 * Creates a report against one post, comment, or message.
 * The reported user is always derived from the target record.
 */
export async function createReport(
  reporterId: string,
  input: CreateReportInput,
) {
  const validatedReporterId = await assertActiveReporter(reporterId);
  const validated = reportInputSchema.parse(input);

  let reportedUserId: string | null = null;
  let postId: string | null = null;
  let commentId: string | null = null;
  let messageId: string | null = null;

  if (validated.targetType === "post") {
    const post = await assertCanAccessPost(
      validatedReporterId,
      validated.targetId,
    );

    reportedUserId = post.authorId;
    postId = post.id;
  }

  if (validated.targetType === "comment") {
    const [comment] = await db
      .select({
        id: comments.id,
        authorId: comments.authorId,
        postId: comments.postId,
      })
      .from(comments)
      .where(
        and(eq(comments.id, validated.targetId), eq(comments.status, "active")),
      )
      .limit(1);

    if (!comment) {
      throw new AppError("Comment not found.", "COMMENT_NOT_FOUND", 404);
    }

    await assertCanAccessPost(validatedReporterId, comment.postId);

    reportedUserId = comment.authorId;
    commentId = comment.id;
  }

  if (validated.targetType === "message") {
    const [message] = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        conversationId: messages.conversationId,
      })
      .from(messages)
      .where(
        and(eq(messages.id, validated.targetId), isNull(messages.deletedAt)),
      )
      .limit(1);

    if (!message) {
      throw new AppError("Message not found.", "MESSAGE_NOT_FOUND", 404);
    }

    const isMember = await isConversationMember(
      message.conversationId,
      validatedReporterId,
    );

    if (!isMember) {
      throw new AppError(
        "You cannot report a message from a conversation you do not belong to.",
        "FORBIDDEN",
        403,
      );
    }

    reportedUserId = message.senderId;
    messageId = message.id;
  }

  if (reportedUserId === validatedReporterId) {
    throw new AppError(
      "You cannot report your own content.",
      "INVALID_REPORT_TARGET",
      400,
    );
  }

  const [report] = await db
    .insert(reports)
    .values({
      reporterId: validatedReporterId,
      reportedUserId,
      postId,
      commentId,
      messageId,
      reason: validated.reason,
      description: validated.description || null,
    })
    .returning();

  return report;
}

/**
 * Lists reports submitted by the authenticated reporter.
 * A reporter can only see their own submissions.
 */
export async function getMyReports(
  reporterId: string,
  options?: {
    status?: ReportListStatus;
    limit?: number;
    offset?: number;
  },
) {
  const validatedReporterId = uuidSchema.parse(reporterId);
  const validatedOptions = reportListOptionsSchema.parse(options ?? {});

  const conditions = [eq(reports.reporterId, validatedReporterId)];

  if (validatedOptions.status) {
    conditions.push(eq(reports.status, validatedOptions.status));
  }

  return db
    .select()
    .from(reports)
    .where(and(...conditions))
    .orderBy(desc(reports.createdAt))
    .limit(validatedOptions.limit)
    .offset(validatedOptions.offset);
}

/**
 * Allows the original reporter to withdraw their own report.
 *
 * Only pending and reviewing reports can be withdrawn.
 * The report remains in the database for moderation history.
 */
export async function withdrawReport(reporterId: string, reportId: string) {
  const validatedReporterId = uuidSchema.parse(reporterId);
  const validatedReportId = uuidSchema.parse(reportId);

  // Find the report while enforcing reporter ownership.
  const [existing] = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.id, validatedReportId),
        eq(reports.reporterId, validatedReporterId),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new AppError("Report not found.", "REPORT_NOT_FOUND", 404);
  }

  if (existing.status !== "pending" && existing.status !== "reviewing") {
    throw new AppError(
      "Only pending or reviewing reports can be withdrawn.",
      "REPORT_CANNOT_BE_WITHDRAWN",
      409,
    );
  }

  // Update only if the report is still in a withdrawable state.
  const [updated] = await db
    .update(reports)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(reports.id, validatedReportId),
        eq(reports.reporterId, validatedReporterId),
        inArray(reports.status, ["pending", "reviewing"]),
      ),
    )
    .returning();

  if (!updated) {
    throw new AppError(
      "The report status changed while you were withdrawing it. Please reload and try again.",
      "REPORT_UPDATE_CONFLICT",
      409,
    );
  }

  return updated;
}

/**
 * Lists reports for the administrative review queue.
 */
export async function getReports(
  actorId: string,
  options?: {
    status?: ReportStatus;
    limit?: number;
    offset?: number;
  },
) {
  await requireReportAccess(uuidSchema.parse(actorId));

  const validatedOptions = reportListOptionsSchema.parse(options ?? {});

  const conditions = validatedOptions.status
    ? [eq(reports.status, validatedOptions.status)]
    : [];

  return db
    .select()
    .from(reports)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reports.createdAt))
    .limit(validatedOptions.limit)
    .offset(validatedOptions.offset);
}

/**
 * Retrieves one report for administrative review.
 */
export async function getReportById(actorId: string, reportId: string) {
  await requireReportAccess(uuidSchema.parse(actorId));

  const validatedId = uuidSchema.parse(reportId);

  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, validatedId))
    .limit(1);

  if (!report) {
    throw new AppError("Report not found.", "REPORT_NOT_FOUND", 404);
  }

  return report;
}

/**
 * Valid status transitions:
 *
 * pending -> reviewing, resolved, dismissed
 * reviewing -> resolved, dismissed
 *
 * resolved and dismissed are terminal states.
 * Repeating the current status is allowed as an idempotent operation.
 */
function assertValidStatusTransition(
  currentStatus: ReportListStatus,
  nextStatus: ReportStatus,
) {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions: Record<ReportListStatus, ReportStatus[]> = {
    pending: ["reviewing", "resolved", "dismissed"],
    reviewing: ["resolved", "dismissed"],
    resolved: [],
    dismissed: [],
    withdrawn: [],
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(
      `A report cannot move from ${currentStatus} to ${nextStatus}.`,
      "INVALID_REPORT_STATUS_TRANSITION",
      409,
    );
  }
}
/**
 * Changes the review status of a report.
 */
export async function updateReportStatus(
  actorId: string,
  reportId: string,
  status: ReportStatus,
) {
  await requireReportAccess(uuidSchema.parse(actorId));

  const validatedId = uuidSchema.parse(reportId);
  const validatedStatus = adminReportStatusSchema.parse(status);

  const [existing] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, validatedId))
    .limit(1);

  if (!existing) {
    throw new AppError("Report not found.", "REPORT_NOT_FOUND", 404);
  }

  assertValidStatusTransition(existing.status, validatedStatus);

  if (existing.status === validatedStatus) {
    return existing;
  }

  const [updated] = await db
    .update(reports)
    .set({ status: validatedStatus })
    .where(
      and(eq(reports.id, validatedId), eq(reports.status, existing.status)),
    )
    .returning();

  if (!updated) {
    throw new AppError(
      "The report changed while you were updating it. Please reload and try again.",
      "REPORT_UPDATE_CONFLICT",
      409,
    );
  }

  return updated;
}
