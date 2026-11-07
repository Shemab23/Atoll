import { z } from "zod";

import { adminController } from "@/server/controllers/admin";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const grantRoleSchema = z.object({
  role: z.enum(["admin", "moderator"]),
});

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { userId } = await params;
    const input = await parseJsonBody(request, grantRoleSchema);

    return apiSuccess(
      await adminController.grantAdministratorRole(userId, input.role),
      201,
    );
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return withApiHandler(async () => {
    const { userId } = await params;

    return apiSuccess(await adminController.revokeAdministratorRole(userId));
  });
}
