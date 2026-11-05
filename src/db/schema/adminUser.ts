import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const adminRoleEnum = pgEnum("admin_role", [
  "owner",
  "admin",
  "moderator",
]);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),

    role: adminRoleEnum("role").notNull(),

    grantedBy: uuid("granted_by").references(() => profiles.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_users_user_id_unique_idx").on(table.userId),
    index("admin_users_role_idx").on(table.role),
    index("admin_users_granted_by_idx").on(table.grantedBy),
  ],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
