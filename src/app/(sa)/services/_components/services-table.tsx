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
import { MoreHorizontal, Edit, Trash2, Power, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface Service {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    isActive: boolean;
    updatedAt: string | Date;
}

interface ServicesTableProps {
    initialServices: Service[];
}

export function ServicesTable({ initialServices }: ServicesTableProps) {
    const [services, setServices] = useState(initialServices);
    const router = useRouter();

    const toggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/services/${id}`, {
                method: "PUT",
                body: JSON.stringify({ isActive: !currentStatus }),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Failed to update status");

            setServices((prev) =>
                prev.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s))
            );
            toast.success(`Service ${!currentStatus ? "activated" : "deactivated"}`);
        } catch (error) {
            toast.error("Failed to update service status");
        }
    };

    const deleteService = async (id: string) => {
        if (!confirm("Are you sure you want to delete this service?")) return;

        try {
            const res = await fetch(`/api/services/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete service");

            setServices((prev) => prev.filter((s) => s.id !== id));
            toast.success("Service deleted successfully");
        } catch (error) {
            toast.error("Failed to delete service");
        }
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-zinc-50/50">
                    <TableRow>
                        <TableHead className="font-semibold text-zinc-900">Name</TableHead>
                        <TableHead className="font-semibold text-zinc-900">Slug</TableHead>
                        <TableHead className="font-semibold text-zinc-900 hidden md:table-cell">Status</TableHead>
                        <TableHead className="font-semibold text-zinc-900 hidden lg:table-cell">Last Updated</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                No services found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        services.map((service) => (
                            <TableRow key={service.id} className="hover:bg-zinc-50/50 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-900">{service.name}</span>
                                        <span className="text-xs text-zinc-500 line-clamp-1">{service.shortDescription}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                                        {service.slug}
                                    </code>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    {service.isActive ? (
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-100">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-zinc-500 text-sm hidden lg:table-cell">
                                    {format(new Date(service.updatedAt), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/services/${service.id}/edit`} className="flex items-center">
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit Details</span>
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => toggleActive(service.id, service.isActive)} className="flex items-center">
                                                <Power className="mr-2 h-4 w-4" />
                                                <span>{service.isActive ? "Deactivate" : "Activate"}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteService(service.id)} className="flex items-center text-red-600 focus:text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Delete Service</span>
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
    );
}
