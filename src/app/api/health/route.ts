import { HealthController } from "@/server/controllers/health";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const controller = new HealthController();

export const GET = withApiHandler(async () => {
  const result = await controller.execute();

  return apiSuccess(result, result.status === "ok" ? 200 : 503);
});
