import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PackageDetail } from "@/components/packages/package-detail";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function PackageDetailPage({
    params,
}: {
    params: Promise<{ projectId: string; packageSlug: string }>;
}) {
    const { projectId, packageSlug } = await params;

    const [project, pkg, allServices] = await Promise.all([
        prisma.project.findUnique({ where: { id: projectId } }),
        prisma.package.findUnique({ where: { slug: packageSlug } }),
        prisma.service.findMany({ where: { isActive: true } }),
    ]);

    if (!project || !pkg) notFound();

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 font-bold tracking-tight px-3">
                    {pkg.category} Package
                </Badge>
            </div>

            <PageHeader
                title={pkg.name}
                description={pkg.shortDescription}
            />

            <Separator className="my-8" />

            <PackageDetail
                pkg={pkg}
                project={project}
                services={allServices}
            />
        </div>
    );
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-[1px] bg-zinc-100 ${className}`} />;
}
