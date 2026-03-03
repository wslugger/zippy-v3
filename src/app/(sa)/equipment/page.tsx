import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EquipmentCatalogPage() {
    const items = await (prisma as any).equipment.findMany({
        orderBy: [{ model: "asc" }, { description: "asc" }],
    });

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="Equipment Catalog"
                    description="Standard hardware and software components used for solution building."
                />
                <Button asChild>
                    <Link href="/equipment/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Hardware
                    </Link>
                </Button>
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
                                    <Badge variant={item.active ? "outline" : "secondary"}>
                                        {item.status}
                                    </Badge>
                                </div>

                                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-400 font-medium uppercase tracking-wider">Roles</span>
                                        <span className="font-semibold text-zinc-700">{item.roles?.join(', ') || item.role || 'N/A'}</span>
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
