import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import AdminNav from "@/components/admin/AdminNav";
import Toasts from "@/components/admin/Toasts";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  const settings = await getSettings();
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-stone-900 flex flex-col">
      <AdminNav salonName={settings.salon_name} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-5">
          {children}
        </main>
      </div>
      <Toasts />
    </div>
  );
}