import { prisma } from "@/lib/prisma";
import { TaxonomyForm } from "./_components/taxonomy-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Global Taxonomy | Zippy v3",
    description: "Manage global shared data points and dictionaries.",
};

export default async function TaxonomyPage() {
    // Fetch initial taxonomy data on the server
    const taxonomy = await prisma.globalTaxonomy.findUnique({
        where: { type: "global" },
    });

    return (
        <div className="container mx-auto max-w-7xl pt-6 pb-20">
            <TaxonomyForm initialData={taxonomy?.data || {}} />
        </div>
    );
}
