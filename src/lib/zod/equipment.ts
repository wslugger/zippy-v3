import { z } from "zod";

// -----------------------------------------------------------------
// 1. Core / Identity & Lifecycle
// -----------------------------------------------------------------
export const BaseEquipmentSchema = z.object({
    id: z.string().optional(),
    make: z.string().min(1, "Make is required"),
    vendorId: z.string().optional(),
    model: z.string().min(1, "Model is required"),
    family: z.string().min(1, "Family is required"),
    role: z.string().min(1, "Role is required"),

    // Service Catalog Mapping
    service: z.string().min(1, "Service is required"),
    serviceOption: z.string().min(1, "Service Option is required"),

    // Lifecycle
    active: z.boolean().default(true),
    status: z.string().min(1, "Status is required"), // Managed via Taxonomy
    eosDate: z.string().datetime().nullable().optional(),
});

// -----------------------------------------------------------------
// 2. Financials (Embedded Dual-Axis)
// -----------------------------------------------------------------
export const PricingSchema = z.object({
    purchasePrice: z.number().min(0, "Purchase price cannot be negative"),
    rentalPrice: z.number().min(0, "Rental price cannot be negative"),
    managementSize: z.string().min(1, "Management size is required"),
});

// -----------------------------------------------------------------
// 3. Technical Specs (Polymorphic properties)
// -----------------------------------------------------------------

// A) WAN Specs
export const WANSpecsSchema = z.object({
    rawFirewallThroughputMbps: z.number().optional(),
    sdwanCryptoThroughputMbps: z.number().optional(),
    advancedSecurityThroughputMbps: z.number().optional(),
    wanPortCount: z.number().optional(),
    wanPortType: z.string().optional(),
    lanPortCount: z.number().optional(),
    lanPortType: z.string().optional(),
});

// B) LAN Specs
export const LANSpecsSchema = z.object({
    accessPortCount: z.number().optional(),
    accessPortType: z.string().optional(),
    uplinkPortCount: z.number().optional(),
    uplinkPortType: z.string().optional(),
    poeBudgetWatts: z.number().optional(),
    isStackable: z.boolean().default(false),
});

// C) WLAN Specs
export const WLANSpecsSchema = z.object({
    wifiStandard: z.string().optional(),
    mimoBandwidth: z.string().optional(),
    powerDrawWatts: z.number().optional(),
    environment: z.string().optional(), // Indoor, Outdoor
});

// -----------------------------------------------------------------
// Discriminated Schema for Inbound/Outbound Validation
// -----------------------------------------------------------------

export const CreateEquipmentSchema = BaseEquipmentSchema.extend({
    pricing: PricingSchema,
    specs: z.union([
        WANSpecsSchema,
        LANSpecsSchema,
        WLANSpecsSchema,
        z.record(z.string(), z.unknown()) // Fallback for unmatched roles
    ] as any),
});

export const UpdateEquipmentSchema = CreateEquipmentSchema.partial();

export type EquipmentPayload = z.infer<typeof CreateEquipmentSchema>;
