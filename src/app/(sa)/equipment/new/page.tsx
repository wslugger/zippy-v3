import { prisma } from "@/lib/prisma";
import { EquipmentForm } from "../_components/equipment-form";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewEquipmentPage() {
    const [taxonomy, services] = await Promise.all([
        prisma.globalTaxonomy.findFirst({
            where: { slug: "global_taxonomy_v1" },
        }),
        prisma.service.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" }
        })
    ]);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Add Catalog Entry"
                description="Register new hardware capabilities in the global BOM catalog."
            />
            <div className="max-w-5xl">
                <EquipmentForm taxonomy={taxonomy} services={services as any} />
            </div>
        </div>
    );
}
