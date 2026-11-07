import { moderationController } from "@/server/controllers/moderation";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

type RouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { reportId } = await params;

    return apiSuccess(await moderationController.getReportById(reportId));
  });
}
