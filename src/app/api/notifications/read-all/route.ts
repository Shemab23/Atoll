import { notificationController } from "@/server/controllers/notification";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

export async function PATCH() {
  return withApiHandler(async () => {
    const result = await notificationController.markAllAsRead();

    return apiSuccess(result);
  });
}
