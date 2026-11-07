import { adminController } from "@/server/controllers/admin";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

export async function GET() {
  return withApiHandler(async () =>
    apiSuccess(await adminController.getAdministrators()),
  );
}
