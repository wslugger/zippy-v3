import { z } from "zod";

export const CreatePriceSchema = z.object({
    sku: z.string().min(1, "SKU is required"),
    listPrice: z
        .number()
        .min(0, "List price cannot be negative"),
    currency: z.string().min(1, "Currency is required").default("USD"),
    effectiveDate: z.string().datetime({ message: "Effective date must be a valid ISO date" }),
});

export const BulkCreatePricesSchema = z.array(CreatePriceSchema).min(1, "At least one price entry is required");

export const UpdatePriceSchema = CreatePriceSchema.partial();

export type CreatePriceInput = z.infer<typeof CreatePriceSchema>;
export type BulkCreatePricesInput = z.infer<typeof BulkCreatePricesSchema>;
export type UpdatePriceInput = z.infer<typeof UpdatePriceSchema>;
