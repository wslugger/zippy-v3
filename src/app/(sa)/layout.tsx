import { AppSidebar } from "@/components/layout/app-sidebar";
import { ModuleBreadcrumbs } from "@/components/layout/module-breadcrumbs";

export default function SALayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ModuleBreadcrumbs />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
