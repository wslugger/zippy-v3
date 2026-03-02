import { PageHeader } from "@/components/layout/page-header";

export default function BOMPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="BOM Generation Module"
                description="Coming soon: Detailed Bill of Materials for each site."
            />
            <div className="h-64 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400">
                Placeholder for BOM content
            </div>
        </div>
    );
}
