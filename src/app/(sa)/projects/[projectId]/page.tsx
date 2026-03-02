import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStatusBadge } from "@/components/projects/module-status-badge";
import { CollateralList } from "@/components/packages/collateral-list";
import { MODULE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { ModuleStates, ModuleState, Collateral } from "@/lib/types";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) notFound();

  const moduleStates = project.moduleStates as ModuleStates;
  const collateral = project.packageCollateral as unknown as Collateral[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.customerName}
        description={project.description || "No description provided"}
      />

      {/* Module Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(
          Object.entries(MODULE_LABELS) as [keyof ModuleStates, string][]
        ).map(([key, label]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <ModuleStatusBadge state={moduleStates[key] as ModuleState} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module 1: Package Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Package Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.packageName ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">
                  Selected Package
                </p>
                <p className="text-lg font-semibold">{project.packageName}</p>
              </div>
              {collateral.length > 0 && (
                <CollateralList items={collateral} />
              )}
              <Link href={`/projects/${projectId}/packages`}>
                <Button variant="outline">Change Package</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                No package selected yet. Select a service package to continue.
              </p>
              <Link href={`/projects/${projectId}/packages`}>
                <Button>Select Package</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
