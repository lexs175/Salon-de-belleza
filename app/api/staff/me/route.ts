import { NextResponse } from "next/server";
import { getLoggedStaff, unauthorizedStaff } from "@/lib/staff-guard";

export async function GET() {
  const staff = await getLoggedStaff();
  if (!staff) return unauthorizedStaff();

  return NextResponse.json({
    staff: {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      avatar: staff.avatar,
      phone: staff.phone,
      email: staff.email,
      services: staff.services,
    },
  });
}
