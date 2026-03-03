import { prisma } from "@/lib/prisma";
import { TaxonomyForm } from "./_components/taxonomy-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Global Taxonomy | Zippy v3",
    description: "Manage global shared data points and dictionaries.",
};

export default async function TaxonomyPage() {
    const taxonomy = await prisma.globalTaxonomy.findFirst({
        where: { slug: "global_taxonomy_v1" },
    });

    // If no taxonomy record exists, start with an empty form
    let initialData: Record<string, string[]> = {};

    if (taxonomy) {
        const defaultExtras: Record<string, string[]> = {
            equipmentRoles: ["WAN", "LAN", "WLAN", "SECURITY"],
            equipmentStatus: ["Available", "EOS", "EOL"],
            managementSizes: ["Small", "Medium", "Large"],
            environments: ["Indoor", "Outdoor"],
            portTypes: ["10/100/1000", "1/2.5/5/10 Gbps", "10G SFP+", "40G QSFP"],
        };

        const dbExtras = (taxonomy.extraFields as Record<string, string[]> | null) ?? {};

        const allData: Record<string, string[]> = {
            collateralTypes: taxonomy.collateralTypes || [],
            ...defaultExtras,
            ...dbExtras,
        };

        initialData = Object.fromEntries(
            Object.entries(allData).filter(([, v]) => Array.isArray(v))
        );
    }

    return (
        <div className="container mx-auto max-w-7xl pt-6 pb-20">
            <TaxonomyForm initialData={initialData} />
        </div>
    );
}
