import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PackageDetail } from "@/components/packages/package-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PackageServiceInclusion } from "@/lib/types";

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; packageSlug: string }>;
}) {
  const { projectId, packageSlug } = await params;

  const [project, pkg] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.package.findFirst({
      where: { slug: packageSlug, isActive: true },
    }),
  ]);

  if (!project || !pkg) notFound();

  // Fetch full defined services for the package's inclusions
  const serviceInclusions = (pkg.includedServices || []) as unknown as PackageServiceInclusion[];
  const serviceSlugs = serviceInclusions.map((s) => s.serviceSlug).filter(Boolean);

  const [fullServices, features] = await Promise.all([
    prisma.service.findMany({
      where: { slug: { in: serviceSlugs }, isActive: true },
    }),
    prisma.feature.findMany({
      where: { service: { in: serviceInclusions.map((s) => s.serviceName) } }
    })
  ]);

  // Combine into a minimal catalog for the detail view
  const servicesCatalog = fullServices.map(s => ({
    ...s,
    serviceOptions: s.serviceOptions as any, // Cast Json[] to match our internal interface
    features: features.filter(f => f.service === s.name).map(f => f.name)
  }));

  return (
    <div className="space-y-6">
      <PageHeader title={pkg.name} description={pkg.shortDescription}>
        <Link href={`/projects/${projectId}/packages`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Packages
          </Button>
        </Link>
      </PageHeader>
      <PackageDetail
        pkg={pkg as any}
        projectId={projectId}
        isSelected={project.selectedPackageId === pkg.id}
        servicesCatalog={servicesCatalog as any}
      />
    </div>
  );
}
