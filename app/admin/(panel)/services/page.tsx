import ServicesAdmin from "@/components/admin/ServicesAdmin";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const settings = await getSettings();
  return <ServicesAdmin currency={settings.currency} />;
}