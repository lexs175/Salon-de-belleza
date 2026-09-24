import { NextResponse } from "next/server";
import { getBookings } from "@/lib/db";
import { getLoggedStaff, unauthorizedStaff } from "@/lib/staff-guard";

export async function GET(request: Request) {
  const staff = await getLoggedStaff();
  if (!staff) return unauthorizedStaff();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || undefined;

  const all = await getBookings(date);
  const staffBookings = all.filter((b) => b.staff_id === staff.id);

  return NextResponse.json({ bookings: staffBookings });
}
