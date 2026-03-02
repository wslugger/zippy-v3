import { PageHeader } from "@/components/layout/page-header";

export default function DiscoveryPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Discovery Module"
                description="Coming soon: Site information extraction and requirements gathering."
            />
            <div className="h-64 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-400">
                Placeholder for Discovery content
            </div>
        </div>
    );
}
