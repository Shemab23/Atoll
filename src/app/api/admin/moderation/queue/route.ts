import { z } from "zod";

import { moderationController } from "@/server/controllers/moderation";
import { AppError } from "@/server/errors/app-error";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["pending", "reviewing"]).default("pending"),
});

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const url = new URL(request.url);

    const parsed = querySchema.safeParse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    });

    if (!parsed.success) {
      throw new AppError(
        "Invalid moderation queue filters.",
        "VALIDATION_ERROR",
        400,
      );
    }

    return apiSuccess(await moderationController.getQueue(parsed.data));
  });
}
