import type { APIRoute } from "astro";
import prisma from "../utils/database";

export const GET: APIRoute = async () => {
  try {
    // Perform a simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      ok: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    return Response.json({
      ok: false,
      message: "Database connection failed",
    }, { status: 500 });
  }
};
