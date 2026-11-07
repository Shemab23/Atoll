import { z } from "zod";

import { reportController } from "@/server/controllers/report";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const reportSchema = z.discriminatedUnion("targetType", [
  z
    .object({
      targetType: z.literal("post"),
      targetId: z.string().uuid(),
      reason: z.string().trim().min(2).max(80),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),

  z
    .object({
      targetType: z.literal("comment"),
      targetId: z.string().uuid(),
      reason: z.string().trim().min(2).max(80),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),

  z
    .object({
      targetType: z.literal("message"),
      targetId: z.string().uuid(),
      reason: z.string().trim().min(2).max(80),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),
]);

/**
 * POST /api/reports
 * Submit a report against a post, comment, or message.
 */
export const POST = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, reportSchema);

  const result = await reportController.createReport(input);

  return apiSuccess(result, 201);
});
