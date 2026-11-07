import { z } from "zod";

import { postController } from "@/server/controllers/post";
import { AppError } from "@/server/errors/app-error";
import { apiSuccess } from "@/server/http/api-response";
import { withApiHandler } from "@/server/http/with-api-handler";

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});

export const GET = withApiHandler(async (request: Request) => {
  const url = new URL(request.url);

  const result = paginationSchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });

  if (!result.success) {
    throw new AppError(
      "Invalid pagination parameters.",
      "VALIDATION_ERROR",
      400,
    );
  }

  const posts = await postController.getOwnPosts(result.data);

  return apiSuccess(posts);
});
