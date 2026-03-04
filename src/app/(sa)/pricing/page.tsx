import { prisma } from "@/lib/prisma";
import PricingClientPage from "./_components/pricing-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export default async function PricingPage() {
    const [prices, licenses, equipment] = await Promise.all([
        db.price.findMany({ orderBy: { sku: "asc" } }),
        db.license.findMany({ select: { sku: true } }),
        db.equipment.findMany({ select: { sku: true } }),
    ]);

    const pricedSkus = new Set<string>(prices.map((p: { sku: string }) => p.sku));

    const orphanLicenseSkus: string[] = licenses
        .map((l: { sku: string }) => l.sku)
        .filter((sku: string) => !pricedSkus.has(sku));

    const orphanEquipmentSkus: string[] = equipment
        .map((e: { sku: string }) => e.sku)
        .filter((sku: string) => !pricedSkus.has(sku));

    return (
        <PricingClientPage
            initialPrices={prices}
            orphanLicenseSkus={orphanLicenseSkus}
            orphanEquipmentSkus={orphanEquipmentSkus}
        />
    );
}
