import { z } from "zod";

export const CreateLicenseSchema = z.object({
    sku: z.string().min(1, "SKU is required"),
    name: z.string().min(1, "Name is required"),
    termMonths: z
        .number()
        .int("Term must be a whole number")
        .min(1, "Term must be at least 1 month"),
    vendor: z.string().min(1, "Vendor is required"),
    supportedHardware: z.array(z.string()).default([]),
    supportedPackages: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
});

export const UpdateLicenseSchema = CreateLicenseSchema.partial();

export type CreateLicenseInput = z.infer<typeof CreateLicenseSchema>;
export type UpdateLicenseInput = z.infer<typeof UpdateLicenseSchema>;
