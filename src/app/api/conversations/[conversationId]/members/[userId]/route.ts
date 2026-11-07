import { z } from "zod";

import { conversationController } from "@/server/controllers/conversation";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  conversationId: z.string().uuid(),
  userId: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{
    conversationId: string;
    userId: string;
  }>;
};

/**
 * DELETE /api/conversations/[conversationId]/members/[userId]
 * Remove another member from a group conversation.
 */
export const DELETE = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await conversationController.removeMember(
      params.conversationId,
      params.userId,
    );

    return apiSuccess(result);
  },
);
