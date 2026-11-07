import { z } from "zod";

import { blockController } from "@/server/controllers/block";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  userId: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ userId: string }>;
};

/**
 * POST /api/users/[userId]/block
 * Block a user.
 */
export const POST = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await blockController.blockUser(params.userId);

    return apiSuccess(result);
  },
);

/**
 * DELETE /api/users/[userId]/block
 * Unblock a user.
 */
export const DELETE = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await blockController.unblockUser(params.userId);

    return apiSuccess(result);
  },
);
