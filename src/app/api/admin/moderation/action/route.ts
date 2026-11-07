import { z } from "zod";

import { moderationController } from "@/server/controllers/moderation";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const moderationActionSchema = z.object({
  reportId: z.string().uuid(),
  actionType: z.enum(["warning", "hide", "suspend", "ban"]),
  reason: z.string().trim().min(3).max(1000),
  expiresAt: z.coerce.date().nullable().optional(),
});

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const url = new URL(request.url);

    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    if (
      !Number.isInteger(limit) ||
      !Number.isInteger(offset) ||
      limit < 1 ||
      limit > 100 ||
      offset < 0
    ) {
      throw new Error("Invalid pagination parameters.");
    }

    return apiSuccess(
      await moderationController.getModerationActions({
        limit,
        offset,
      }),
    );
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const input = await parseJsonBody(request, moderationActionSchema);

    return apiSuccess(
      await moderationController.applyReportModerationAction(input),
      201,
    );
  });
}
