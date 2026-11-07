import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { withApiHandler } from "@/server/http/with-api-handler";

export const GET = withApiHandler(async () => {
  const filePath = join(process.cwd(), "docs", "api", "openapi.yaml");

  const specification = await readFile(filePath, "utf8");

  return new Response(specification, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
});
