import { z } from "zod";

import { messageController } from "@/server/controllers/message";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  messageId: z.string().uuid(),
});

const updateMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
  })
  .strict();

type RouteContext = {
  params: Promise<{ messageId: string }>;
};

/**
 * PATCH /api/messages/[messageId]
 * Edit an existing text message.
 */
export const PATCH = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const input = await parseJsonBody(request, updateMessageSchema);

    const result = await messageController.updateMessage(
      params.messageId,
      input,
    );

    return apiSuccess(result);
  },
);

/**
 * DELETE /api/messages/[messageId]
 * Soft-delete an existing message.
 */
export const DELETE = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await messageController.deleteMessage(params.messageId);

    return apiSuccess(result);
  },
);
