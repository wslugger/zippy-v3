"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Tag, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { FeatureDialog } from "./feature-dialog";

interface Feature {
    id: string;
    name: string;
    service: string;
    status: string;
    description: string | null;
    caveats: string[];
    assumptions: string[];
    updatedAt: string | Date;
}

interface FeaturesTableProps {
    initialFeatures: Feature[];
}

export function FeaturesTable({ initialFeatures }: FeaturesTableProps) {
    const [features, setFeatures] = useState(initialFeatures);
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchFeatures = async () => {
        try {
            const res = await fetch("/api/features");
            if (!res.ok) throw new Error("Failed to fetch features");
            const data = await res.json();
            setFeatures(data);
        } catch (error) {
            toast.error("Failed to refresh features");
        }
    };

    const deleteFeature = async (id: string) => {
        if (!confirm("Are you sure you want to delete this feature?")) return;

        try {
            const res = await fetch(`/api/features/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete feature");

            setFeatures((prev) => prev.filter((f) => f.id !== id));
            toast.success("Feature deleted successfully");
        } catch (error) {
            toast.error("Failed to delete feature");
        }
    };

    const handleEdit = (feature: Feature) => {
        setEditingFeature(feature);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingFeature(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                    Add New Feature
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50/50">
                        <TableRow>
                            <TableHead className="font-semibold text-zinc-900">Name</TableHead>
                            <TableHead className="font-semibold text-zinc-900">Service</TableHead>
                            <TableHead className="font-semibold text-zinc-900">Status</TableHead>
                            <TableHead className="font-semibold text-zinc-900 hidden lg:table-cell">Last Updated</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {features.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                    No features found. Build your catalog.
                                </TableCell>
                            </TableRow>
                        ) : (
                            features.map((feature) => (
                                <TableRow key={feature.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-900">{feature.name}</span>
                                            <span className="text-xs text-zinc-500 line-clamp-1">{feature.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-zinc-400" />
                                            <span className="text-sm text-zinc-600">{feature.service}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100">
                                            {feature.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-sm hidden lg:table-cell">
                                        {format(new Date(feature.updatedAt), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => handleEdit(feature)} className="flex items-center">
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit Feature</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => deleteFeature(feature.id)} className="flex items-center text-red-600 focus:text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete Feature</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <FeatureDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                feature={editingFeature}
                onSuccess={fetchFeatures}
            />
        </div>
    );
}
