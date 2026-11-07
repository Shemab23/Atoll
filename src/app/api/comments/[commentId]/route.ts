import { z } from "zod";

import { commentController } from "@/server/controllers/comment";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const uuidSchema = z.string().uuid();

const updateCommentSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

type RouteContext = {
  params: Promise<{
    commentId: string;
  }>;
};

// PATCH /api/comments/[commentId]
export const PATCH = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const { commentId } = await context.params;
    uuidSchema.parse(commentId);

    const input = await parseJsonBody(request, updateCommentSchema);
    const comment = await commentController.updateComment(commentId, input);

    return apiSuccess(comment);
  },
);

// DELETE /api/comments/[commentId]
export const DELETE = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const { commentId } = await context.params;
    uuidSchema.parse(commentId);

    const result = await commentController.deleteComment(commentId);

    return apiSuccess(result);
  },
);
