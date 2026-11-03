import { sql } from "drizzle-orm";
import { profiles } from "./profiles";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const postTypeEnum = pgEnum("post_type", ["text", "image", "mixed"]);

export const visibilityEnum = pgEnum("visibility", ["public", "followers"]);

export const postStatusEnum = pgEnum("post_status", [
  "active",
  "hidden",
  "deleted",
]);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    content: text("content"),
    postType: postTypeEnum("post_type").notNull(),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    status: postStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("posts_author_id_idx").on(table.authorId),
    index("posts_created_at_idx").on(table.createdAt),
    check(
      "posts_post_type_check",
      sql`${table.postType} IN ('text', 'image', 'mixed')`,
    ),
    check(
      "posts_visibility_check",
      sql`${table.visibility} IN ('public', 'followers')`,
    ),
    check(
      "posts_status_check",
      sql`${table.status} IN ('active', 'hidden', 'deleted')`,
    ),
  ],
);

export const postMedia = pgTable(
  "post_media",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    mediaType: text("media_type").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("post_media_post_id_idx").on(table.postId)],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostMedia = typeof postMedia.$inferSelect;
export type NewPostMedia = typeof postMedia.$inferInsert;
