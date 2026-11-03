import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { posts } from "./posts";
import { comments } from "./actions";
import { messages } from "./messages";

// ENUMS
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

// REPORTS TABLE
export const reports = pgTable(
  "reports",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    reporterId: uuid("reporter_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    reportedUserId: uuid("reported_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    postId: uuid("post_id").references(() => posts.id, {
      onDelete: "set null",
    }),

    commentId: uuid("comment_id").references(() => comments.id, {
      onDelete: "set null",
    }),

    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),

    reason: text("reason").notNull(),

    description: text("description"),

    status: reportStatusEnum("status").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // A report must target exactly one piece of content.
    check(
      "reports_exactly_one_target_check",
      sql`num_nonnulls(${table.postId}, ${table.commentId}, ${table.messageId}) = 1`,
    ),

    index("reports_status_created_at_idx").on(table.status, table.createdAt),

    index("reports_reporter_id_idx").on(table.reporterId),

    index("reports_reported_user_id_idx").on(table.reportedUserId),
  ],
);

// BLOCKS TABLE
export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("blocks_blocker_id_blocked_id_unique_idx").on(
      table.blockerId,
      table.blockedId,
    ),

    index("blocks_blocked_id_idx").on(table.blockedId),
  ],
);

// TYPES
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
