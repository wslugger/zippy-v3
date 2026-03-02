import { PageHeader } from "@/components/layout/page-header";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Start Design Process"
                description="Initialize a new project by providing basic customer details. You'll then proceed to selecting a service package that fits their needs."
            />
            <div className="mt-8">
                <ProjectForm />
            </div>
        </div>
    );
}
