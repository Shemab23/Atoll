import { z } from "zod";

import { reactionController } from "@/server/controllers/reaction";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  postId: z.string().uuid(),
});

const reactionSchema = z
  .object({
    reactionType: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),
  })
  .strict();

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export const POST = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);
    const input = await parseJsonBody(request, reactionSchema);

    const reaction = await reactionController.setPostReaction(
      params.postId,
      input,
    );

    return apiSuccess(reaction, 201);
  },
);

export const DELETE = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await reactionController.removePostReaction(params.postId);

    return apiSuccess(result);
  },
);
