"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Package } from "lucide-react";

interface PackageRow {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    includedServices: unknown[];
    collateral: unknown[];
    isActive: boolean;
    updatedAt: string;
}

interface PackagesTableProps {
    initialPackages: PackageRow[];
}

export function PackagesTable({ initialPackages }: PackagesTableProps) {
    const router = useRouter();
    const [packages, setPackages] = useState(initialPackages);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPackages((prev) => prev.filter((p) => p.id !== id));
                router.refresh();
            } else {
                alert("Failed to delete package. Please try again.");
            }
        } finally {
            setDeleting(null);
        }
    };

    if (packages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No packages yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                    Create your first service package to get started.
                </p>
                <Link href="/packages/new">
                    <Button size="sm">Create Package</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                    <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Short Description</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Services</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Collateral</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {packages.map((pkg) => (
                        <tr key={pkg.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                                <div className="font-medium">{pkg.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{pkg.slug}</div>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                                <p className="truncate text-muted-foreground">{pkg.shortDescription}</p>
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                                {pkg.includedServices.length}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                                {pkg.collateral.length} / 4
                            </td>
                            <td className="px-4 py-3 text-center">
                                <Badge
                                    variant="secondary"
                                    className={
                                        pkg.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-zinc-100 text-zinc-600"
                                    }
                                >
                                    {pkg.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                    <Link href={`/packages/${pkg.id}`}>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Pencil className="h-3.5 w-3.5" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(pkg.id, pkg.name)}
                                        disabled={deleting === pkg.id}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
