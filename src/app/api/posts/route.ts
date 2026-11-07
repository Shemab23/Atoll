import { z } from "zod";

import { postController } from "@/server/controllers/post";
import { apiSuccess } from "@/server/http/api-response";
import { parseJsonBody } from "@/server/http/parse-json-body";
import { withApiHandler } from "@/server/http/with-api-handler";

const createPostSchema = z.object({
  content: z.string().nullable().optional(),

  postType: z.enum(["text", "image", "mixed"]),

  visibility: z.enum(["public", "followers"]).optional(),

  media: z
    .array(
      z.object({
        storagePath: z.string().min(1),
        mediaType: z.enum([
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ]),
        displayOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(10)
    .optional(),
});

export const POST = withApiHandler(async (request: Request) => {
  const input = await parseJsonBody(request, createPostSchema);

  const post = await postController.createPost(input);

  return apiSuccess(post, 201);
});
