import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DesignForm } from "./_components/design-form";

export default async function DesignConfigurationPage({
    params,
}: {
    params: Promise<{ projectId: string }>;
}) {
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project) notFound();
    if (!project.selectedPackageId) {
        return (
            <div className="space-y-6">
                <PageHeader title="Design Configuration" description="Configure the customer design options." />
                <p>Please select a package first.</p>
                <Link href={`/projects/${projectId}/packages`}>
                    <Button>Go to Package Selection</Button>
                </Link>
            </div>
        );
    }

    const packageData = await prisma.package.findUnique({
        where: { id: project.selectedPackageId },
    });

    if (!packageData) notFound();

    // Fetch the detailed services that are included in the package
    const includedServicesData = packageData.includedServices as any[];
    const serviceIds = includedServicesData.map(inc => inc.serviceId);
    const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
    });

    // Fetch full feature details
    const featureSlugs = includedServicesData.flatMap(inc =>
        (inc.includedFeatures || []).map((f: any) => f.featureSlug)
    );
    const features = await prisma.feature.findMany({
        where: { name: { in: featureSlugs } },
    });

    return (
        <div className="space-y-6 pb-20">
            <PageHeader
                title="Design Configuration"
                description={`Configure ${packageData.name} for ${project.customerName}`}
            >
                <Link href={`/projects/${projectId}`}>
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Project
                    </Button>
                </Link>
            </PageHeader>

            <DesignForm
                project={project}
                packageData={packageData}
                services={services}
                features={features}
            />
        </div>
    );
}
