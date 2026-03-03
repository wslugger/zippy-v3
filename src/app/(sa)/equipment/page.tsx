import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatasheetIngestButton } from "./_components/datasheet-ingest-button";
import { DeleteEquipmentButton } from "./_components/delete-equipment-button";

export default async function EquipmentCatalogPage() {
    const [items, taxonomy, services] = await Promise.all([
        (prisma as any).equipment.findMany({
            orderBy: { model: "asc" },
        }),
        prisma.globalTaxonomy.findFirst({
            where: { slug: "global_taxonomy_v1" },
        }),
        prisma.service.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="Equipment Catalog"
                    description="Standard hardware and software components used for solution building."
                />
                <div className="flex items-center gap-2">
                    <DatasheetIngestButton
                        services={services as any}
                        taxonomy={taxonomy}
                    />
                    <Button asChild>
                        <Link href="/equipment/new">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Hardware
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.length === 0 && (
                    <div className="col-span-full text-center p-12 bg-white rounded-xl border-2 border-dashed border-zinc-200">
                        <p className="text-zinc-500 italic">No equipment entries yet. Click "Add Hardware" to get started.</p>
                    </div>
                )}
                {items.map((item: any) => (
                    <Link key={item.id} href={`/equipment/${item.id}`}>
                        <Card className="group hover:border-primary/50 transition-all cursor-pointer">
                            <CardContent className="p-4 flex flex-col h-full space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-0.5">
                                        <h3 className="font-semibold text-lg leading-none group-hover:text-primary transition-colors">
                                            {item.model}
                                        </h3>
                                        <p className="text-sm text-zinc-500 font-medium">Desc: {item.description}</p>
                                        <p className="text-sm text-zinc-500 font-medium">Family: {item.family}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1">
                                            {item.datasheetUrl && (
                                                <a
                                                    href={item.datasheetUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                </a>
                                            )}
                                            <DeleteEquipmentButton
                                                equipmentId={item.id}
                                                model={item.model}
                                                className="h-7 w-7 text-zinc-400 hover:text-destructive"
                                            />
                                        </div>
                                        <Badge variant={item.active ? "outline" : "secondary"}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Capabilities</span>
                                        <div className="flex flex-wrap gap-1">
                                            {(item.roles || [item.role]).filter((r: string) => r && r !== 'SECURITY').map((r: string) => (
                                                <Badge key={r} variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-zinc-200 text-zinc-600 bg-zinc-50/50">
                                                    {r}
                                                </Badge>
                                            ))}
                                            {(!item.roles || item.roles.length === 0) && !item.role && <span className="text-xs text-zinc-400">N/A</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-zinc-400 font-medium uppercase tracking-wider">Pricing</span>
                                        <span className="font-semibold text-zinc-900">
                                            ${item.pricing?.purchasePrice.toLocaleString()} / ${item.pricing?.rentalPrice.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
