import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { adminController } from "@/server/controllers/admin";

export async function GET() {
  return withApiHandler(async () =>
    apiSuccess(await adminController.getOverview()),
  );
}
