import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";
import { reportController } from "@/server/controllers/report";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  return withApiHandler(async () => {
    const { reportId } = await context.params;

    const report = await reportController.withdrawReport(reportId);

    return apiSuccess(report);
  });
}
