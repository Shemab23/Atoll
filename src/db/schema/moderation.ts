import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";
import { reports } from "./reaction";

// ENUMS
export const actionTypeEnum = pgEnum("action_type", [
  "warning",
  "hide",
  "suspend",
  "ban",
]);

// MODERATION ACTIONS TABLE
export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    adminId: uuid("admin_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    targetUserId: uuid("target_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    reportId: uuid("report_id").references(() => reports.id, {
      onDelete: "set null",
    }),

    actionType: actionTypeEnum("action_type").notNull(),

    reason: text("reason").notNull(),

    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "moderation_actions_type_check",
      sql`${table.actionType} IN ('warning', 'hide', 'suspend', 'ban')`,
    ),

    index("moderation_actions_target_user_id_idx").on(table.targetUserId),

    index("moderation_actions_admin_id_idx").on(table.adminId),

    index("moderation_actions_report_id_idx").on(table.reportId),
  ],
);

// TYPES
export type ModerationAction = typeof moderationActions.$inferSelect;
export type NewModerationAction = typeof moderationActions.$inferInsert;
