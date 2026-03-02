import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PackagesTable } from "./_components/packages-table";

export default async function PackagesCatalogPage() {
    const packages = await prisma.package.findMany({
        orderBy: { name: "asc" },
    });

    const formatted = packages.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6">
            <PageHeader
                title="Package Catalog"
                description="Define and manage service packages. Each package specifies which services, options, and features are included and whether they are Required, Standard, or Optional."
            >
                <Link href="/packages/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Package
                    </Button>
                </Link>
            </PageHeader>

            <PackagesTable initialPackages={formatted} />
        </div>
    );
}
