import { prisma } from "@/lib/prisma";
import { EquipmentForm } from "../_components/equipment-form";
import { PageHeader } from "@/components/layout/page-header";
import { notFound } from "next/navigation";

export default async function EditEquipmentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const p = await params;
    const [item, taxonomy, services] = await Promise.all([
        (prisma as any).equipment.findUnique({
            where: { id: p.id },
        }),
        prisma.globalTaxonomy.findFirst({
            where: { slug: "global_taxonomy_v1" },
        }),
        prisma.service.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" }
        })
    ]);

    if (!item) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title={`Edit: ${item.make} ${item.model}`}
                description="Update hardware specifications and technical constraints."
            />
            <div className="max-w-5xl">
                <EquipmentForm initialData={item} taxonomy={taxonomy} services={services as any} />
            </div>
        </div>
    );
}
