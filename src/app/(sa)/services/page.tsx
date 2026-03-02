import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ServicesTable } from "./_components/services-table";

export default async function ServicesCatalogPage() {
    const services = await prisma.service.findMany({
        orderBy: { updatedAt: "desc" },
    });

    const formattedServices = services.map(s => ({
        ...s,
        updatedAt: s.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Service Catalog"
                    description="All active services available for design inclusion across our packages."
                />
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                    <Link href="/services/new">
                        <Plus className="w-4 h-4" />
                        Create Service
                    </Link>
                </Button>
            </div>

            <div> {/* Removed max-w-7xl from this div as it's now on the parent */}
                <ServicesTable initialServices={formattedServices} />
            </div>
        </div>
    );
}
