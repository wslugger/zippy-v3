import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleStatusBadge } from "@/components/projects/module-status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Package as PackageIcon,
    Search,
    PenTool,
    ClipboardCheck,
    ChevronRight,
    Info
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MODULE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

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

    const moduleStates = (project.moduleStates as any) || {};

    const modules = [
        {
            id: "ingestion",
            label: MODULE_LABELS.ingestion,
            icon: PackageIcon,
            description: "Package selection and solution foundation.",
            state: moduleStates.ingestion,
            href: `/projects/${projectId}/packages`,
        },
        {
            id: "discovery",
            label: MODULE_LABELS.discovery,
            icon: Search,
            description: "Site requirements and environment discovery.",
            state: moduleStates.discovery,
            href: `/projects/${projectId}/discovery`,
        },
        {
            id: "architecture",
            label: MODULE_LABELS.architecture,
            icon: PenTool,
            description: "High-level design and platform configuration.",
            state: moduleStates.architecture,
            href: `/projects/${projectId}/architecture`,
        },
        {
            id: "bom",
            label: MODULE_LABELS.bom,
            icon: ClipboardCheck,
            description: "Bill of Materials and hardware selection.",
            state: moduleStates.bom,
            href: `/projects/${projectId}/bom`,
        },
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                title={project.customerName}
                description={project.description || "Design project overview and workflow status."}
                actions={
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg">
                        <Info className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-tighter">Draft Ledger</span>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((mod) => {
                    const Icon = mod.icon;
                    return (
                        <Card key={mod.id} className="relative overflow-hidden group border-zinc-200">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <ModuleStatusBadge state={mod.state} />
                                </div>
                                <CardTitle className="text-base font-bold">{mod.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-6">
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    {mod.description}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Link href={mod.href} className="w-full">
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-between text-xs font-bold group-hover:bg-zinc-50"
                                    >
                                        Manage Module
                                        <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-12 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 bg-zinc-50/50 border-b border-zinc-200 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                        <PackageIcon className="w-5 h-5 text-blue-600" />
                        Selected Package
                    </h2>
                    {project.packageSlug && (
                        <Link href={`/projects/${projectId}/packages/${project.packageSlug}`}>
                            <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-tight">
                                Change Selection
                            </Button>
                        </Link>
                    )}
                </div>
                <div className="p-8">
                    {project.selectedPackageId ? (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-zinc-900 tracking-tight">
                                    {project.packageName}
                                </h3>
                                <p className="text-zinc-500 max-w-xl">
                                    This package defines the core services and collateral that will be used for the HLD and BOM generation.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(project.packageCollateral as any[])?.slice(0, 3).map((item, idx) => (
                                    <Badge key={idx} variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-none px-4 py-1.5 rounded-full font-medium">
                                        {item.title}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <p className="text-zinc-500">No service package has been selected for this project yet.</p>
                            <Link href={`/projects/${projectId}/packages`}>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Select Package <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
