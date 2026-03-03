"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { DatasheetIngestModal } from "./datasheet-ingest-modal";

interface IngestButtonProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    services: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    taxonomy: any;
}

export function DatasheetIngestButton({ services, taxonomy }: IngestButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Import from Datasheet
            </Button>
            <DatasheetIngestModal
                open={open}
                onOpenChange={setOpen}
                services={services}
                taxonomy={taxonomy}
            />
        </>
    );
}
