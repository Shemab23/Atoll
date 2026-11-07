import { z } from "zod";

import { messageController } from "@/server/controllers/message";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  conversationId: z.string().uuid(),
});

const createMessageSchema = z
  .object({
    content: z.string().trim().max(5000).nullable().optional(),
    messageType: z.enum(["text", "image"]).default("text"),
    mediaPath: z.string().trim().min(1).max(1000).nullable().optional(),
  })
  .strict();

const paginationSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
  })
  .strict();

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

/**
 * GET /api/conversations/[conversationId]/messages
 * Retrieve conversation messages.
 */
export const GET = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const url = new URL(request.url);

    const pagination = paginationSchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    const result = await messageController.getConversationMessages(
      params.conversationId,
      pagination,
    );

    return apiSuccess(result);
  },
);

/**
 * POST /api/conversations/[conversationId]/messages
 * Send a text or image message.
 */
export const POST = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const input = await parseJsonBody(request, createMessageSchema);

    const result = await messageController.sendMessage(
      params.conversationId,
      input,
    );

    return apiSuccess(result, 201);
  },
);
