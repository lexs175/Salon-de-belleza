import { NextResponse } from "next/server";
import { getActivePromotion } from "@/lib/db";

export async function GET() {
  const promo = await getActivePromotion();
  return NextResponse.json({ promo: promo ?? null });
}
