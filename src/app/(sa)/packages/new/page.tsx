import { PageHeader } from "@/components/layout/page-header";
import { PackageForm } from "../_components/package-form";
import { prisma } from "@/lib/prisma";

export default async function NewPackagePage() {
    const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader
                title="New Package"
                description="Create a new service package by defining its name, description, included services, and collateral."
            />
            <PackageForm services={services} />
        </div>
    );
}
