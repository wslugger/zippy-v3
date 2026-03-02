import { PageHeader } from "@/components/layout/page-header";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Create New Project"
        description="Enter customer details to start a new network design project"
      />
      <ProjectForm />
    </div>
  );
}
