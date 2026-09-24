import { redirect } from "next/navigation";
import { getSettings } from "@/lib/db";
import { getLoggedStaff } from "@/lib/staff-guard";
import StaffPortal from "@/components/staff/StaffPortal";

export const dynamic = "force-dynamic";

export default async function StaffPortalPage() {
  const staff = await getLoggedStaff();
  if (!staff) {
    redirect("/staff/login");
  }

  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans">
      <StaffPortal
        staff={staff}
        currency={settings.currency || "Bs."}
        salonName={settings.salon_name || "Salón de Belleza"}
      />
    </div>
  );
}
