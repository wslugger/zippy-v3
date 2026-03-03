import Link from "next/link";
import { FolderOpen, Package, Wrench, Star, Globe, Zap, SlidersHorizontal } from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="flex w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold tracking-tight">Zippy v3</span>
      </div>
      <nav className="flex-1 p-3">
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Projects
        </p>
        <Link
          href="/projects"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <FolderOpen className="h-4 w-4" />
          Projects
        </Link>

        <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Catalog
        </p>
        <Link
          href="/packages"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Package className="h-4 w-4" />
          Packages
        </Link>
        <Link
          href="/services"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Wrench className="h-4 w-4" />
          Services
        </Link>
        <Link
          href="/features"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Star className="h-4 w-4" />
          Features
        </Link>
        <Link
          href="/taxonomy"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <Globe className="h-4 w-4" />
          Taxonomy
        </Link>

        <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Settings
        </p>
        <Link
          href="/settings/prompts"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          <SlidersHorizontal className="h-4 w-4" />
          AI Prompts
        </Link>
      </nav>
    </aside>
  );
}

