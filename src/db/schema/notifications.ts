import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

// NOTIFICATIONS TABLE
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),

    notificationType: text("notification_type").notNull(),

    referenceId: uuid("reference_id").notNull(),

    referenceType: text("reference_type").notNull(),

    isRead: boolean("is_read").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_recipient_id_is_read_idx").on(
      table.recipientId,
      table.isRead,
    ),

    index("notifications_recipient_id_created_at_idx").on(
      table.recipientId,
      table.createdAt,
    ),
  ],
);

// TYPES
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
