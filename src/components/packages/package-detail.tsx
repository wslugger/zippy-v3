"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CollateralList } from "./collateral-list";
import { ServiceInclusionBadge } from "./service-inclusion-badge";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

interface PackageDetailProps {
    pkg: any;
    project: any;
    services: any[];
}

export function PackageDetail({ pkg, project, services }: PackageDetailProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSelect = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectedPackageId: pkg.id,
                    packageName: pkg.name,
                    packageSlug: pkg.slug,
                    packageCollateral: pkg.collateral,
                }),
            });

            if (res.ok) {
                router.push(`/projects/${project.id}`);
            }
        } catch (error) {
            console.error("Failed to select package:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <section>
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">Package Overview</h2>
                    <div className="prose prose-zinc max-w-none text-zinc-600">
                        {pkg.description || pkg.shortDescription}
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">Included Services</h2>
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                <tr>
                                    <th className="px-6 py-3 font-semibold text-zinc-700">Service Name</th>
                                    <th className="px-6 py-3 font-semibold text-zinc-700">Inclusion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {pkg.includedServices.map((inc: any) => {
                                    const srv = services.find((s) => s.id === inc.serviceId);
                                    return (
                                        <tr key={inc.serviceId}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-zinc-900">{srv?.name || "Unknown"}</div>
                                                <div className="text-xs text-zinc-500 truncate max-w-[300px]">{srv?.shortDescription}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <ServiceInclusionBadge type={inc.inclusionType} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">Package Collateral</h2>
                    <CollateralList collateral={pkg.collateral} />
                </section>
            </div>

            <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Project</p>
                            <h3 className="text-lg font-bold text-zinc-900">{project.customerName}</h3>
                        </div>

                        <Separator className="bg-zinc-200" />

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-zinc-600">
                                    Full service lifecycle management included
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-zinc-600">
                                    24/7 proactive monitoring and response
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-zinc-600">
                                    Comprehensive HLD generation
                                </p>
                            </div>
                        </div>

                        <Button
                            className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-[0.98]"
                            disabled={loading}
                            onClick={handleSelect}
                        >
                            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Select this Package
                        </Button>

                        <p className="text-[10px] text-zinc-400 text-center uppercase font-medium tracking-tight">
                            Selecting this package will finalize the ingestion phase.
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        className="w-full text-zinc-500 hover:text-zinc-900 hover:bg-transparent"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to All Packages
                    </Button>
                </div>
            </div>
        </div>
    );
}
