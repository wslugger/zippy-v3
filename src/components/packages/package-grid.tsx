"use client";

import { PackageCard } from "./package-card";

interface PackageGridProps {
    packages: any[];
    projectId: string;
}

export function PackageGrid({ packages, projectId }: PackageGridProps) {
    // Group by category
    const categories = Array.from(new Set(packages.map((p) => p.category)));

    return (
        <div className="space-y-12">
            {categories.map((category) => (
                <div key={category} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-zinc-900">{category} Packages</h2>
                        <div className="h-[1px] flex-1 bg-zinc-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packages
                            .filter((p) => p.category === category)
                            .map((pkg) => (
                                <PackageCard key={pkg.id} pkg={pkg} projectId={projectId} />
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
