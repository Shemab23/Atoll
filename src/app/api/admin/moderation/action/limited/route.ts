import { z } from "zod";

import { moderationController } from "@/server/controllers/moderation";
import { AppError } from "@/server/errors/app-error";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const actionSchema = z.object({
  reportId: z.string().uuid(),
  actionType: z.enum(["warning", "hide", "suspend", "ban"]),
  reason: z.string().trim().min(3).max(1000),
  expiresAt: z.coerce.date().nullable().optional(),
});

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const url = new URL(request.url);

    const parsed = querySchema.safeParse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      throw new AppError(
        "Invalid moderation history filters.",
        "VALIDATION_ERROR",
        400,
      );
    }

    return apiSuccess(await moderationController.getHistory(parsed.data));
  });
}

export async function POST(request: Request) {
  return withApiHandler(async () => {
    const input = await parseJsonBody(request, actionSchema);

    return apiSuccess(await moderationController.applyAction(input), 201);
  });
}
