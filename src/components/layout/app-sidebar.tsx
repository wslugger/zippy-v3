"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Package, Settings, ChevronRight, ListChecks, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Projects", href: "/projects", icon: LayoutDashboard },
    { name: "New Project", href: "/projects/new", icon: PlusCircle },
    { name: "Services", href: "/services", icon: Package },
    { name: "Features", href: "/features", icon: ListChecks },
    { name: "Global Taxonomy", href: "/taxonomy", icon: Database },
];

export function AppSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r bg-zinc-50/50 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
            <div className="p-6">
                <Link href="/projects" className="flex items-center gap-2 font-bold text-xl tracking-tight text-zinc-900">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">Z</div>
                    <span>Zippy v3</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group",
                                isActive
                                    ? "bg-white text-blue-600 shadow-sm border border-zinc-200"
                                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                                {item.name}
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-200">
                <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                    <Settings className="w-4 h-4 text-zinc-400" />
                    Settings
                </button>
            </div>
        </aside>
    );
}
