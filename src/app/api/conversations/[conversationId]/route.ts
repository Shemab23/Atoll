import { z } from "zod";

import { conversationController } from "@/server/controllers/conversation";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  conversationId: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

/**
 * GET /api/conversations/[conversationId]
 * Retrieve conversation details.
 */
export const GET = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await conversationController.getConversationDetails(
      params.conversationId,
    );

    return apiSuccess(result);
  },
);
