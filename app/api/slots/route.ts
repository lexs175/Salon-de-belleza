import { getAvailableSlots } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const serviceId = Number(url.searchParams.get("serviceId") ?? "0");
  const staffIdParam = url.searchParams.get("staffId");
  const staffId = staffIdParam && staffIdParam !== "null" && staffIdParam !== "any" ? Number(staffIdParam) : null;
  const excludeBookingIdParam = url.searchParams.get("excludeBookingId");
  const excludeBookingId = excludeBookingIdParam ? Number(excludeBookingIdParam) : null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !serviceId) {
    return Response.json({ slots: [] });
  }
  const slots = await getAvailableSlots(date, serviceId, staffId, excludeBookingId);
  return Response.json({ slots });
}