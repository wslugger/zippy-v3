import { AppSidebar } from "@/components/layout/app-sidebar";
import { ModuleBreadcrumbs } from "@/components/layout/module-breadcrumbs";

export default function SALayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white flex">
            <AppSidebar />
            <div className="flex-1 pl-64 flex flex-col">
                <ModuleBreadcrumbs />
                <main className="p-8 pb-20">
                    <div className="w-full animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
