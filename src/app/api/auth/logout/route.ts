import { authController } from "@/server/controllers/auth";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

export const POST = withApiHandler(async () => {
  const result = await authController.logout();

  return apiSuccess(result);
});
