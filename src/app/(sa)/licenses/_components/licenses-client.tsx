"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { LicenseForm } from "./license-form";
import { useRouter } from "next/navigation";

interface License {
    id: string;
    sku: string;
    name: string;
    vendor: string;
    termMonths: number;
    supportedHardware: string[];
    supportedPackages: string[];
    isActive: boolean;
}

export default function LicensesClientPage({ initialLicenses }: { initialLicenses: License[] }) {
    const router = useRouter();
    const [licenses, setLicenses] = useState<License[]>(initialLicenses);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<License | null>(null);

    const refresh = async () => {
        const res = await fetch("/api/licenses");
        if (res.ok) setLicenses(await res.json());
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete license "${name}"?`)) return;
        const res = await fetch(`/api/licenses/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("License deleted");
            setLicenses((prev) => prev.filter((l) => l.id !== id));
        } else {
            toast.error("Failed to delete license");
        }
    };

    const openCreate = () => { setEditing(null); setDialogOpen(true); };
    const openEdit = (l: License) => { setEditing(l); setDialogOpen(true); };
    const onSuccess = () => { setDialogOpen(false); refresh(); router.refresh(); };

    return (
        <div className="space-y-6 max-w-[1400px]">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="Licensing Catalog"
                    description="Manage software licenses linked to hardware SKUs and packages."
                />
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" /> New License
                </Button>
            </div>

            {licenses.length === 0 ? (
                <div className="text-center p-16 bg-white rounded-xl border-2 border-dashed border-zinc-200">
                    <KeyRound className="mx-auto h-10 w-10 text-zinc-300 mb-3" />
                    <p className="text-zinc-500 italic">No licenses yet. Click &quot;New License&quot; to get started.</p>
                </div>
            ) : (
                <div className="rounded-xl border bg-white overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-zinc-50">
                                <TableHead className="font-semibold">SKU</TableHead>
                                <TableHead className="font-semibold">Name</TableHead>
                                <TableHead className="font-semibold">Vendor</TableHead>
                                <TableHead className="font-semibold">Term</TableHead>
                                <TableHead className="font-semibold">Hardware</TableHead>
                                <TableHead className="font-semibold">Packages</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {licenses.map((l) => (
                                <TableRow key={l.id} className="hover:bg-zinc-50/50">
                                    <TableCell className="font-mono text-sm text-zinc-600">{l.sku}</TableCell>
                                    <TableCell className="font-medium">{l.name}</TableCell>
                                    <TableCell>{l.vendor}</TableCell>
                                    <TableCell>{l.termMonths}mo</TableCell>
                                    <TableCell>
                                        <span className="text-sm text-zinc-500">{l.supportedHardware.length} SKU{l.supportedHardware.length !== 1 ? "s" : ""}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-zinc-500">{l.supportedPackages.length} pkg{l.supportedPackages.length !== 1 ? "s" : ""}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={l.isActive ? "default" : "secondary"}>
                                            {l.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => handleDelete(l.id, l.name)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-[560px] p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-4 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
                                <KeyRound className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base leading-tight">
                                    {editing ? "Edit License" : "New License"}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                                    {editing ? `Editing ${editing.sku}` : "Add a new software license to the catalog"}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <LicenseForm
                        initialData={editing ? (editing as unknown as Record<string, unknown>) : undefined}
                        onSuccess={onSuccess}
                        onCancel={() => setDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
