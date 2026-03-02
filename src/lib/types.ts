import { z } from "zod";

// ---- Shared rich text fields (used at all catalog levels) ----
const richTextFields = {
  name: z.string().min(1),
  shortDescription: z.string(),
  description: z.string(),
  constraints: z.array(z.string()),
  assumptions: z.array(z.string()),
};

// ---- Module State Tracking ----
export const ModuleStateEnum = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "out_of_date",
  "error",
]);
export type ModuleState = z.infer<typeof ModuleStateEnum>;

export const ModuleStatesSchema = z.object({
  ingestion: ModuleStateEnum,
  customization: ModuleStateEnum,
  bomGeneration: ModuleStateEnum,
  hldGeneration: ModuleStateEnum,
});
export type ModuleStates = z.infer<typeof ModuleStatesSchema>;

export const DEFAULT_MODULE_STATES: ModuleStates = {
  ingestion: "not_started",
  customization: "not_started",
  bomGeneration: "not_started",
  hldGeneration: "not_started",
};

// ---- Design Option Choice ----
export const DesignOptionChoiceSchema = z.object({
  value: z.string(),
  label: z.string(),
  ...richTextFields,
});
export type DesignOptionChoice = z.infer<typeof DesignOptionChoiceSchema>;

// ---- Design Option Group ----
export const DesignOptionGroupSchema = z.object({
  groupId: z.string(),
  groupLabel: z.string(),
  ...richTextFields,
  selectionType: z.enum(["single", "multi"]),
  choices: z.array(DesignOptionChoiceSchema),
});
export type DesignOptionGroup = z.infer<typeof DesignOptionGroupSchema>;

// ---- Service Option ----
export const ServiceOptionSchema = z.object({
  optionId: z.string(),
  ...richTextFields,
  features: z.array(z.string()),
  designOptions: z.array(DesignOptionGroupSchema),
});
export type ServiceOption = z.infer<typeof ServiceOptionSchema>;

// ---- Collateral ----
export const COLLATERAL_TYPES = ["PDF", "Diagram", "Reference", "Video"] as const;
export type CollateralType = (typeof COLLATERAL_TYPES)[number];

export const CollateralSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(COLLATERAL_TYPES),
});
export type Collateral = z.infer<typeof CollateralSchema>;

// ---- Inclusion Designation ----
export const InclusionDesignationEnum = z.enum(["required", "standard", "optional"]);
export type InclusionDesignation = z.infer<typeof InclusionDesignationEnum>;

export const INCLUSION_DESIGNATION_LABELS: Record<InclusionDesignation, string> = {
  required: "Required",
  standard: "Standard (Opt-out)",
  optional: "Optional (Opt-in)",
};

// ---- Package Service Inclusion ----
// Each entry links a service to the package and specifies
// which service-options and features are included, plus the designation.
export const PackageServiceInclusionSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  serviceSlug: z.string(),
  designation: InclusionDesignationEnum,
  // Selected options with their designations
  includedOptions: z
    .array(
      z.object({
        optionId: z.string(),
        designation: InclusionDesignationEnum,
      })
    )
    .default([]),
  // Selected features with their designations 
  includedFeatures: z
    .array(
      z.object({
        featureSlug: z.string(),
        designation: InclusionDesignationEnum,
      })
    )
    .default([]),
  // Selected design choices with their designations
  includedDesignChoices: z
    .array(
      z.object({
        groupId: z.string(),
        choiceValue: z.string(),
        designation: InclusionDesignationEnum,
      })
    )
    .default([]),
});
export type PackageServiceInclusion = z.infer<typeof PackageServiceInclusionSchema>;

/** @deprecated use PackageServiceInclusionSchema */
export const ServiceInclusionSchema = z.object({
  serviceId: z.string(),
  serviceName: z.string(),
  inclusion: z.enum(["required", "standard", "optional"]),
});
export type ServiceInclusion = z.infer<typeof ServiceInclusionSchema>;

// ---- Package CRUD ----
export const CreatePackageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9\-_]+$/, "Slug must be lowercase letters, numbers, hyphens, and underscores only"),
  shortDescription: z.string().min(1, "Short description is required"),
  description: z.string().default(""),
  includedServices: z.array(PackageServiceInclusionSchema).default([]),
  collateral: z
    .array(CollateralSchema)
    .max(4, "Maximum 4 collateral items allowed")
    .default([]),
  isActive: z.boolean().default(true),
});
export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;

export const UpdatePackageSchema = CreatePackageSchema.partial();
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

// ---- Project CRUD ----
export const CreateProjectSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(200),
  description: z.string().max(1000).optional().default(""),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  selectedPackageId: z.string().optional(),
  packageSlug: z.string().optional(),
  packageName: z.string().optional(),
  packageReasoning: z.string().optional(),
  packageCollateral: z.array(CollateralSchema).optional(),
  moduleStates: ModuleStatesSchema.partial().optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
