import { z } from "zod";

import { commentController } from "@/server/controllers/comment";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const uuidSchema = z.string().uuid();

const createCommentSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
    parentId: uuidSchema.nullable().optional(),
  })
  .strict();

const paginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

// GET /api/posts/[postId]/comments
export const GET = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const { postId } = await context.params;
    uuidSchema.parse(postId);

    const url = new URL(request.url);

    const pagination = paginationSchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    const comments = await commentController.getPostComments(
      postId,
      pagination.limit,
      pagination.offset,
    );

    return apiSuccess(comments);
  },
);

// POST /api/posts/[postId]/comments
export const POST = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const { postId } = await context.params;
    uuidSchema.parse(postId);

    const input = await parseJsonBody(request, createCommentSchema);
    const comment = await commentController.createComment(postId, input);

    return apiSuccess(comment, 201);
  },
);
