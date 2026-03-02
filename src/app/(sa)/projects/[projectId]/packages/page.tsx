import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PackageGrid } from "@/components/packages/package-grid";
import { notFound } from "next/navigation";

export default async function PackageBrowsePage({
    params,
}: {
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = await params;

    const [project, packages] = await Promise.all([
        prisma.project.findUnique({ where: { id: projectId } }),
        prisma.package.findMany({ where: { isActive: true } }),
    ]);

    if (!project) notFound();

    return (
        <div className="space-y-8">
            <PageHeader
                title="Select Service Package"
                description={`Tailor the solution for ${project.customerName} by choosing one of our curated service bundles. Each package defines the standard and optional service options available in the next design phase.`}
            />

            <div className="mt-8">
                <PackageGrid packages={packages} projectId={projectId} />
            </div>
        </div>
    );
}
