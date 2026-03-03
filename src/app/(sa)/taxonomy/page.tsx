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
        const allData: Record<string, string[]> = {
            collateralTypes: taxonomy.collateralTypes || [],
            ...(taxonomy.extraFields as Record<string, string[]> | null ?? {}),
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
