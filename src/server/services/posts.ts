import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { posts, postMedia } from "@/db/schema";
import { AppError } from "@/server/errors/app-error";

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const uuidSchema = z.string().uuid();

const mediaInputSchema = z
  .object({
    storagePath: z
      .string()
      .trim()
      .min(1)
      .max(2048)
      .refine(
        (path) =>
          !path.startsWith("/") &&
          !path.split("/").includes("..") &&
          !path.includes("\\"),
        "Invalid media storage path.",
      ),

    mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),

    displayOrder: z.number().int().min(0).max(100).default(0),
  })
  .strict();

const createPostSchema = z
  .object({
    content: z.string().trim().max(5000).nullable().optional(),

    postType: z.enum(["text", "image", "mixed"]),

    visibility: z.enum(["public", "followers"]).default("public"),

    media: z.array(mediaInputSchema).max(10).default([]),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.postType === "text") {
      if (!data.content) {
        context.addIssue({
          code: "custom",
          path: ["content"],
          message: "Text posts must contain content.",
        });
      }

      if (data.media.length > 0) {
        context.addIssue({
          code: "custom",
          path: ["media"],
          message: "Text posts cannot contain media.",
        });
      }
    }

    if (data.postType === "image") {
      if (data.media.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["media"],
          message: "Image posts must contain at least one media item.",
        });
      }

      if (data.content) {
        context.addIssue({
          code: "custom",
          path: ["content"],
          message: "Image posts cannot contain text.",
        });
      }
    }

    if (data.postType === "mixed") {
      if (!data.content) {
        context.addIssue({
          code: "custom",
          path: ["content"],
          message: "Mixed posts must contain text.",
        });
      }

      if (data.media.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["media"],
          message: "Mixed posts must contain at least one media item.",
        });
      }
    }

    const orders = data.media.map((item) => item.displayOrder);

    if (new Set(orders).size !== orders.length) {
      context.addIssue({
        code: "custom",
        path: ["media"],
        message: "Media display orders must be unique.",
      });
    }
  });

const updatePostSchema = z
  .object({
    content: z.string().trim().max(5000).nullable().optional(),
    visibility: z.enum(["public", "followers"]).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one post field must be provided.",
  });

const paginationSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(20),
    offset: z.number().int().min(0).max(100000).default(0),
  })
  .strict();

export type CreatePostInput = z.input<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type GetOwnPostsOptions = z.input<typeof paginationSchema>;

// -----------------------------------------------------------------------------
// Shared validation helpers
// -----------------------------------------------------------------------------

function validateUuid(value: string, fieldName: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(`Invalid ${fieldName}.`, "INVALID_POST_IDENTIFIER", 400);
  }

  return result.data;
}

function validateMediaOwnership(
  authorId: string,
  media: Array<z.infer<typeof mediaInputSchema>>,
) {
  for (const item of media) {
    if (!item.storagePath.startsWith(`${authorId}/`)) {
      throw new AppError(
        "You can only attach media that belongs to your account.",
        "INVALID_MEDIA_OWNERSHIP",
        403,
      );
    }
  }
}

function validatePostContent(
  postType: "text" | "image" | "mixed",
  content: string | null,
  hasMedia: boolean,
) {
  if (postType === "text" && (!content || hasMedia)) {
    throw new AppError(
      "Text posts must contain text and cannot contain media.",
      "INVALID_POST_CONTENT",
      400,
    );
  }

  if (postType === "image" && (!hasMedia || content)) {
    throw new AppError(
      "Image posts must contain media and cannot contain text.",
      "INVALID_POST_CONTENT",
      400,
    );
  }

  if (postType === "mixed" && (!content || !hasMedia)) {
    throw new AppError(
      "Mixed posts must contain text and media.",
      "INVALID_POST_CONTENT",
      400,
    );
  }
}

// -----------------------------------------------------------------------------
// Create post
// -----------------------------------------------------------------------------

export async function createPost(authorId: string, input: CreatePostInput) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedInput = createPostSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError("Invalid post information.", "INVALID_POST_INPUT", 400);
  }

  const { media, ...postData } = validatedInput.data;

  validateMediaOwnership(validatedAuthorId, media);

  return db.transaction(async (tx) => {
    const [post] = await tx
      .insert(posts)
      .values({
        authorId: validatedAuthorId,
        ...postData,
      })
      .returning();

    if (!post) {
      throw new AppError(
        "The post could not be created.",
        "POST_CREATION_FAILED",
        500,
      );
    }

    if (media.length > 0) {
      await tx.insert(postMedia).values(
        media.map((item) => ({
          postId: post.id,
          storagePath: item.storagePath,
          mediaType: item.mediaType,
          displayOrder: item.displayOrder,
        })),
      );
    }

    const savedMedia = await tx
      .select()
      .from(postMedia)
      .where(eq(postMedia.postId, post.id))
      .orderBy(postMedia.displayOrder);

    return {
      ...post,
      media: savedMedia,
    };
  });
}

// -----------------------------------------------------------------------------
// Retrieve one of the current user's posts
// -----------------------------------------------------------------------------

export async function getOwnPost(authorId: string, postId: string) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedPostId = validateUuid(postId, "post ID");

  const [post] = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.id, validatedPostId),
        eq(posts.authorId, validatedAuthorId),
        eq(posts.status, "active"),
      ),
    )
    .limit(1);

  if (!post) {
    throw new AppError("Post not found.", "POST_NOT_FOUND", 404);
  }

  const media = await db
    .select()
    .from(postMedia)
    .where(eq(postMedia.postId, validatedPostId))
    .orderBy(postMedia.displayOrder);

  return {
    ...post,
    media,
  };
}

// -----------------------------------------------------------------------------
// Retrieve the current user's posts
// -----------------------------------------------------------------------------

export async function getOwnPosts(
  authorId: string,
  options: GetOwnPostsOptions = {},
) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedOptions = paginationSchema.safeParse(options);

  if (!validatedOptions.success) {
    throw new AppError(
      "Invalid post pagination options.",
      "INVALID_POST_PAGINATION",
      400,
    );
  }

  const { limit, offset } = validatedOptions.data;

  const userPosts = await db
    .select()
    .from(posts)
    .where(
      and(eq(posts.authorId, validatedAuthorId), eq(posts.status, "active")),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  if (userPosts.length === 0) {
    return [];
  }

  const postIds = userPosts.map((post) => post.id);

  const media = await db
    .select()
    .from(postMedia)
    .where(inArray(postMedia.postId, postIds))
    .orderBy(postMedia.displayOrder);

  const mediaByPost = new Map<string, typeof media>();

  for (const item of media) {
    const existing = mediaByPost.get(item.postId) ?? [];
    existing.push(item);
    mediaByPost.set(item.postId, existing);
  }

  return userPosts.map((post) => ({
    ...post,
    media: mediaByPost.get(post.id) ?? [],
  }));
}

// -----------------------------------------------------------------------------
// Update post
// -----------------------------------------------------------------------------

export async function updatePost(
  authorId: string,
  postId: string,
  input: UpdatePostInput,
) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedPostId = validateUuid(postId, "post ID");
  const validatedInput = updatePostSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new AppError("Invalid post information.", "INVALID_POST_INPUT", 400);
  }

  return db.transaction(async (tx) => {
    const [existingPost] = await tx
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.id, validatedPostId),
          eq(posts.authorId, validatedAuthorId),
          eq(posts.status, "active"),
        ),
      )
      .limit(1);

    if (!existingPost) {
      throw new AppError("Post not found.", "POST_NOT_FOUND", 404);
    }

    const nextContent =
      validatedInput.data.content !== undefined
        ? validatedInput.data.content
        : existingPost.content;

    const [updatedPost] = await tx
      .update(posts)
      .set({
        ...validatedInput.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(posts.id, validatedPostId),
          eq(posts.authorId, validatedAuthorId),
          eq(posts.status, "active"),
        ),
      )
      .returning();

    if (!updatedPost) {
      throw new AppError("Post not found.", "POST_NOT_FOUND", 404);
    }

    // Media and postType are not editable through this operation.
    // Validate the resulting content against the existing post type.
    const existingMedia = await tx
      .select({ id: postMedia.id })
      .from(postMedia)
      .where(eq(postMedia.postId, validatedPostId))
      .limit(1);

    validatePostContent(
      existingPost.postType,
      nextContent,
      existingMedia.length > 0,
    );

    return updatedPost;
  });
}

// -----------------------------------------------------------------------------
// Soft-delete post
// -----------------------------------------------------------------------------

export async function deletePost(authorId: string, postId: string) {
  const validatedAuthorId = validateUuid(authorId, "author ID");
  const validatedPostId = validateUuid(postId, "post ID");

  const [deletedPost] = await db
    .update(posts)
    .set({
      status: "deleted",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(posts.id, validatedPostId),
        eq(posts.authorId, validatedAuthorId),
        eq(posts.status, "active"),
      ),
    )
    .returning({
      id: posts.id,
      status: posts.status,
    });

  if (!deletedPost) {
    throw new AppError("Post not found.", "POST_NOT_FOUND", 404);
  }

  return deletedPost;
}
