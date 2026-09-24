import Agenda from "@/components/admin/Agenda";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const settings = await getSettings();
  return <Agenda currency={settings.currency} />;
}