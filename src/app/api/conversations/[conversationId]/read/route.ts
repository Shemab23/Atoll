import { z } from "zod";

import { messageController } from "@/server/controllers/message";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  conversationId: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

/**
 * POST /api/conversations/[conversationId]/read
 * Mark the conversation as read.
 */
export const POST = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await messageController.markConversationAsRead(
      params.conversationId,
    );

    return apiSuccess(result);
  },
);
