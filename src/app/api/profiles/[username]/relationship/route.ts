import { z } from "zod";

import { followController } from "@/server/controllers/follow";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  username: z.string().trim().min(1),
});

type RouteContext = {
  params: Promise<{ username: string }>;
};

export const GET = withApiHandler(
  async (_request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);

    const result = await followController.getRelationship(params.username);

    return apiSuccess(result);
  },
);
