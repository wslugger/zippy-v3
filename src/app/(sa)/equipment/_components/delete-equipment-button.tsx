"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteEquipmentDialog } from "./delete-equipment-dialog";

interface DeleteEquipmentButtonProps {
    equipmentId: string;
    model: string;
    variant?: "outline" | "ghost" | "destructive" | "default";
    size?: "sm" | "default" | "icon";
    redirectToCatalog?: boolean;
    className?: string;
}

export function DeleteEquipmentButton({
    equipmentId,
    model,
    variant = "ghost",
    size = "icon",
    redirectToCatalog = false,
    className,
}: DeleteEquipmentButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={className}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                <Trash2 className="h-4 w-4" />
                {size !== "icon" && <span className="ml-2">Delete</span>}
            </Button>

            <DeleteEquipmentDialog
                equipmentId={equipmentId}
                model={model}
                open={open}
                onOpenChange={setOpen}
                redirectToCatalog={redirectToCatalog}
            />
        </>
    );
}
