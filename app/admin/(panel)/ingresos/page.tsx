import IncomeAdmin from "@/components/admin/IncomeAdmin";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const settings = await getSettings();
  return <IncomeAdmin currency={settings.currency} />;
}