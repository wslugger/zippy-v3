import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { PackageGrid } from "@/components/packages/package-grid";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PackageSelectionPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const [project, packages] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.package.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Select a Service Package"
        description={`Choose a base package for ${project.customerName}`}
      >
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </PageHeader>
      <PackageGrid
        packages={packages}
        projectId={projectId}
        selectedPackageId={project.selectedPackageId}
      />
    </div>
  );
}
