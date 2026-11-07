import { adminController } from "@/server/controllers/admin";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { userId } = await params;

    return apiSuccess(await adminController.getUserById(userId));
  });
}
