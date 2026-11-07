import { z } from "zod";

import { conversationController } from "@/server/controllers/conversation";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  conversationId: z.string().uuid(),
});

const addMemberSchema = z
  .object({
    userId: z.string().uuid(),
  })
  .strict();

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

/**
 * POST /api/conversations/[conversationId]/members
 * Add a member to a group conversation.
 */
export const POST = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);
    const input = await parseJsonBody(request, addMemberSchema);

    const result = await conversationController.addMember(
      params.conversationId,
      input,
    );

    return apiSuccess(result, result.added ? 201 : 200);
  },
);
