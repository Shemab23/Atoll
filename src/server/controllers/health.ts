import { sql } from "drizzle-orm";

import { db } from "@/db";

export class HealthController {
  async execute() {
    const timestamp = new Date().toISOString();

    try {
      await db.execute(sql`SELECT 1`);

      return {
        status: "ok" as const,
        timestamp,
        checks: {
          api: "ok" as const,
          database: "ok" as const,
        },
      };
    } catch {
      console.error("Health check: database connection failed.");

      return {
        status: "degraded" as const,
        timestamp,
        checks: {
          api: "ok" as const,
          database: "error" as const,
        },
      };
    }
  }
}
