import { PageHeader } from "@/components/layout/page-header";
import { PackageForm } from "../_components/package-form";
import { prisma } from "@/lib/prisma";

export default async function NewPackagePage() {
    const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    const allFeatures = await prisma.feature.findMany({
        where: { service: { in: services.map((s) => s.name) } },
        orderBy: { name: "asc" },
    });

    const taxonomy = await prisma.globalTaxonomy.findFirst();
    const collateralTypes = taxonomy?.collateralTypes || ["PDF", "Diagram", "Reference", "Video"];

    const servicesWithFeatures = services.map((s) => ({
        ...s,
        features: allFeatures.filter((f) => f.service === s.name).map((f) => f.name),
    }));

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader
                title="New Package"
                description="Create a new service package by defining its name, description, included services, and collateral."
            />
            <PackageForm services={servicesWithFeatures} collateralTypes={collateralTypes} />
        </div>
    );
}
