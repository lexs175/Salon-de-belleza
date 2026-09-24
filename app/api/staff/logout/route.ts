import { NextResponse } from "next/server";
import { STAFF_COOKIE_NAME } from "@/lib/staff-guard";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
  return res;
}
