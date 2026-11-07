import { z } from "zod";

import { followController } from "@/server/controllers/follow";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const paramsSchema = z.object({
  username: z.string().trim().min(1),
});

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});

type RouteContext = {
  params: Promise<{ username: string }>;
};

export const GET = withApiHandler(
  async (request: Request, context: RouteContext) => {
    const params = paramsSchema.parse(await context.params);
    const searchParams = new URL(request.url).searchParams;

    const pagination = paginationSchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    const result = await followController.getFollowers(
      params.username,
      pagination.limit,
      pagination.offset,
    );

    return apiSuccess(result);
  },
);
