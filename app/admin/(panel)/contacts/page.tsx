import ContactsAdmin from "@/components/admin/ContactsAdmin";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const settings = await getSettings();
  return <ContactsAdmin currency={settings.currency} />;
}
