import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { FeaturesTable } from "./_components/features-table";

export default async function FeaturesCatalogPage() {
    const features = await prisma.feature.findMany({
        orderBy: [{ service: "asc" }, { name: "asc" }],
    });

    const formattedFeatures = features.map(f => ({
        ...f,
        updatedAt: f.updatedAt.toISOString(),
    }));

    return (
        <div className="space-y-6 max-w-[1400px]">
            <PageHeader
                title="Features Catalog"
                description="Manage core capabilities that can be mapped to services and options."
            />

            <div className="max-w-6xl">
                <FeaturesTable initialFeatures={formattedFeatures} />
            </div>
        </div>
    );
}
