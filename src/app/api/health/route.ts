import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);

    return Response.json({
      status: "ok",
      database: "connected",
      orm: "drizzle",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return Response.json(
      {
        status: "error",
        database: "unavailable",
      },
      { status: 503 },
    );
  }
}
