import { z } from "zod";

import { conversationController } from "@/server/controllers/conversation";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const createConversationSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("direct"),
      participantId: z.string().uuid(),
    })
    .strict(),

  z
    .object({
      type: z.literal("group"),
      participantIds: z.array(z.string().uuid()).min(1).max(49),
    })
    .strict(),
]);

/**
 * GET /api/conversations
 * List the current user's conversations.
 */
export const GET = withApiHandler(async () => {
  const result = await conversationController.getConversations();

  return apiSuccess(result);
});

/**
 * POST /api/conversations
 * Create a direct or group conversation.
 */
export const POST = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, createConversationSchema);

  const result = await conversationController.createConversation(input);

  const status = "created" in result && result.created === false ? 200 : 201;

  return apiSuccess(result, status);
});
