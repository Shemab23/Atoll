import { z } from "zod";

import { moderationController } from "@/server/controllers/moderation";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const batchSchema = z.object({
  actions: z
    .array(
      z.object({
        reportId: z.string().uuid(),
        actionType: z.enum(["warning", "hide", "suspend", "ban"]),
        reason: z.string().trim().min(3).max(1000),
        expiresAt: z.coerce.date().nullable().optional(),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const input = await parseJsonBody(request, batchSchema);

    return apiSuccess(
      await moderationController.applyBatchActions(input.actions),
    );
  });
}
