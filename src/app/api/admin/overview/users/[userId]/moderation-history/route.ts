import { adminController } from "@/server/controllers/admin";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { userId } = await params;
    const url = new URL(request.url);

    const limit = Number(url.searchParams.get("limit") ?? 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    if (
      !Number.isInteger(limit) ||
      !Number.isInteger(offset) ||
      limit < 1 ||
      limit > 100 ||
      offset < 0
    ) {
      throw new Error("Invalid pagination parameters.");
    }

    return apiSuccess(
      await adminController.getUserModerationHistory(userId, { limit, offset }),
    );
  });
}
