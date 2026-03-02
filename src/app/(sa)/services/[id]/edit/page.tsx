import { prisma } from "@/lib/prisma";
import { ServiceForm } from "../../_components/service-form";
import { notFound } from "next/navigation";

interface EditServicePageProps {
    params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
    const { id } = await params;
    const service = await prisma.service.findUnique({
        where: { id },
    });

    if (!service) {
        notFound();
    }

    // Format Prisma JSON fields for client-side form
    const formattedService = {
        ...service,
        serviceOptions: (service.serviceOptions as any[]).map(opt => ({
            ...opt,
            constraints: opt.constraints || [],
            assumptions: opt.assumptions || [],
            designOptions: opt.designOptions || []
        })),
    };

    return (
        <div className="py-8 max-w-[1400px]">
            <ServiceForm initialData={formattedService} serviceId={id} />
        </div>
    );
}
