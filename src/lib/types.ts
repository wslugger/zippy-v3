import { z } from "zod";

export const DesignOptionChoiceSchema = z.object({
    value: z.string(),
    label: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    constraints: z.array(z.string()),
    assumptions: z.array(z.string()),
});

export const DesignOptionGroupSchema = z.object({
    groupId: z.string(),
    groupLabel: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    constraints: z.array(z.string()),
    assumptions: z.array(z.string()),
    selectionType: z.enum(["single", "multi"]),
    choices: z.array(DesignOptionChoiceSchema),
});

export const ServiceOptionSchema = z.object({
    optionId: z.string(),
    name: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    constraints: z.array(z.string()),
    assumptions: z.array(z.string()),
    features: z.array(z.string()),
    designOptions: z.array(DesignOptionGroupSchema),
});

export const ServiceInclusionSchema = z.object({
    serviceId: z.string(),
    inclusionType: z.enum(["required", "standard", "optional"])
});

export const CollateralSchema = z.object({
    type: z.enum(["datasheet", "architecture_guide", "case_study", "video", "whitepaper", "other"]),
    title: z.string(),
    url: z.string(),
});

export const ModuleStatesSchema = z.object({
    ingestion: z.enum(["not_started", "in_progress", "completed", "out_of_date"]),
    discovery: z.enum(["not_started", "in_progress", "completed", "out_of_date"]),
    architecture: z.enum(["not_started", "in_progress", "completed", "out_of_date"]),
    bom: z.enum(["not_started", "in_progress", "completed", "out_of_date"]),
});

export const CreateProjectSchema = z.object({
    customerName: z.string().min(1, "Customer name is required"),
    description: z.string().optional(),
});

export const UpdateProjectSchema = z.object({
    customerName: z.string().optional(),
    description: z.string().optional(),
    selectedPackageId: z.string().optional(),
    packageName: z.string().optional(),
    packageSlug: z.string().optional(),
    packageCollateral: z.array(CollateralSchema).optional(),
    moduleStates: ModuleStatesSchema.partial().optional(),
});

// Zod Inference
export type DesignOptionChoice = z.infer<typeof DesignOptionChoiceSchema>;
export type DesignOptionGroup = z.infer<typeof DesignOptionGroupSchema>;
export type ServiceOption = z.infer<typeof ServiceOptionSchema>;
export type ServiceInclusion = z.infer<typeof ServiceInclusionSchema>;
export type CollateralItem = z.infer<typeof CollateralSchema>;
export type ModuleStates = z.infer<typeof ModuleStatesSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
