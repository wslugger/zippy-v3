import Link from "next/link";
import { FolderOpen, Package, Zap } from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="flex w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">Zippy v3</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        <Link
          href="/projects"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <FolderOpen className="h-4 w-4" />
          Projects
        </Link>
        <Link
          href="/packages"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Package className="h-4 w-4" />
          Packages
        </Link>
      </nav>
    </aside>
  );
}
