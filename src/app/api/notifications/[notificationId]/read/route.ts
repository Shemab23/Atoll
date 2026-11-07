import { z } from "zod";

import { notificationController } from "@/server/controllers/notification";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const uuidSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const { notificationId } = await context.params;

    const validatedId = uuidSchema.parse(notificationId);

    const result = await notificationController.markAsRead(validatedId);

    return apiSuccess(result);
  });
}
