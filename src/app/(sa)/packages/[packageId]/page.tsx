import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PackageForm } from "../_components/package-form";

export default async function EditPackagePage({
    params,
}: {
    params: Promise<{ packageId: string }>;
}) {
    const { packageId } = await params;

    const [pkg, services] = await Promise.all([
        prisma.package.findUnique({ where: { id: packageId } }),
        prisma.service.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    if (!pkg) notFound();

    const allFeatures = await prisma.feature.findMany({
        where: { service: { in: services.map((s) => s.name) } },
        orderBy: { name: "asc" },
    });

    const servicesWithFeatures = services.map((s) => ({
        ...s,
        features: allFeatures.filter((f) => f.service === s.name).map((f) => f.name),
    }));

    const formatted = {
        ...pkg,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader
                title={`Edit: ${pkg.name}`}
                description="Update the package details, included services, and collateral."
            />
            <PackageForm package={formatted} services={servicesWithFeatures as any} />
        </div>
    );
}
