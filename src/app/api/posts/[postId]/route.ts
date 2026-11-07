import { z } from "zod";

import { postController } from "@/server/controllers/post";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

const updatePostSchema = z
  .object({
    content: z.string().trim().max(5000).nullable().optional(),
    visibility: z.enum(["public", "followers"]).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided.",
  });

export const PATCH = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const { postId } = await context.params;

    const validatedPostId = z.string().uuid().parse(postId);
    const input = await parseJsonBody(request, updatePostSchema);

    const result = await postController.updatePost(validatedPostId, input);

    return apiSuccess(result);
  },
);

export const DELETE = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const { postId } = await context.params;

    const validatedPostId = z.string().uuid().parse(postId);

    const result = await postController.deletePost(validatedPostId);

    return apiSuccess(result);
  },
);
