import { prisma } from "@/lib/prisma";
import LicensesClientPage from "./_components/licenses-client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export default async function LicensesPage() {
    const licenses = await db.license.findMany({
        orderBy: [{ vendor: "asc" }, { name: "asc" }],
    });

    return <LicensesClientPage initialLicenses={licenses} />;
}
