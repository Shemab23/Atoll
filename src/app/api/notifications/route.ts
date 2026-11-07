import { z } from "zod";

import { notificationController } from "@/server/controllers/notification";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const querySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
    offset: z.coerce.number().int().min(0).max(100000).default(0),
    unreadOnly: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(false),
  })
  .strict();

export async function GET(request: Request) {
  return withApiHandler(async () => {
    const url = new URL(request.url);

    const query = querySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
      unreadOnly: url.searchParams.get("unreadOnly") ?? undefined,
    });

    const notifications =
      await notificationController.getMyNotifications(query);

    return apiSuccess(notifications);
  });
}
