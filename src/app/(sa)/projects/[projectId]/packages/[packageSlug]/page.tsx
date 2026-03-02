import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PackageDetail } from "@/components/packages/package-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
        pkg={pkg}
        projectId={projectId}
        isSelected={project.selectedPackageId === pkg.id}
      />
    </div>
  );
}
