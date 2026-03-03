import { PageHeader } from "@/components/layout/page-header";
import { PromptsForm } from "./_components/prompts-form";

export const metadata = {
    title: "AI Prompts Control | Zippy v3",
    description:
        "Customize the system instructions and model parameters for the SA workflow steps.",
};

export default function AIPromptsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="AI Prompts Control"
                description="Customize the system instructions and model parameters for the SA workflow steps."
            />
            <PromptsForm />
        </div>
    );
}
