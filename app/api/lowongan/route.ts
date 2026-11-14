import { NextResponse } from "next/server";
import { getActiveVacancies } from "@/lib/vacancies/mock-data";

// GET /api/lowongan?page=1&limit=6  -> daftar lowongan aktif (KP-41)
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  const limit = Number.parseInt(params.get("limit") ?? "6", 10);

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 6;

  return NextResponse.json(getActiveVacancies(safePage, safeLimit));
}
