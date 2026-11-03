import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "deleted",
]);

export const allowMessagesEnum = pgEnum("allow_messages", [
  "everyone",
  "followers",
  "nobody",
]);

const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 30 }).notNull(),
    displayName: varchar("display_name", { length: 60 }),
    dateOfBirth: date("date_of_birth", { mode: "string" }).notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    accountStatus: accountStatusEnum("account_status")
      .notNull()
      .default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("profiles_username_unique_idx").on(
      sql`lower(${table.username})`,
    ),
    check(
      "profiles_username_format_check",
      sql`${table.username} ~ '^[a-zA-Z0-9_]{3,30}$'`,
    ),
    index("profiles_username_idx").on(table.username),
  ],
);

export const profileSettings = pgTable("profile_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  isDiscoverable: boolean("is_discoverable").notNull().default(true),
  showOnlineStatus: boolean("show_online_status").notNull().default(true),
  allowMessages: allowMessagesEnum("allow_messages")
    .notNull()
    .default("everyone"),
  notificationPreferences: jsonb("notification_preferences")
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type ProfileSettings = typeof profileSettings.$inferSelect;
export type NewProfileSettings = typeof profileSettings.$inferInsert;
