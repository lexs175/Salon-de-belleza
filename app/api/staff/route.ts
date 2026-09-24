import { NextResponse } from "next/server";
import { getStaff } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceIdParam = url.searchParams.get("serviceId");
  const serviceId = serviceIdParam ? Number(serviceIdParam) : undefined;

  const staff = await getStaff(true, serviceId);
  return NextResponse.json({ staff });
}
