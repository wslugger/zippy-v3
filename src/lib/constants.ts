import { FileText, Play, BookOpen, Layers, Link as LinkIcon } from "lucide-react";

export const MODULE_LABELS = {
    ingestion: "Ingestion",
    discovery: "Discovery",
    architecture: "Architecture",
    bom: "BOM Generation",
} as const;

export const MODULE_STATE_COLORS = {
    not_started: "bg-zinc-200 text-zinc-700 hover:bg-zinc-200/80",
    in_progress: "bg-blue-100 text-blue-700 hover:bg-blue-100/80",
    completed: "bg-green-100 text-green-700 hover:bg-green-100/80",
    out_of_date: "bg-amber-100 text-amber-700 hover:bg-amber-100/80",
} as const;

export const COLLATERAL_TYPE_ICONS = {
    datasheet: FileText,
    architecture_guide: Layers,
    case_study: BookOpen,
    video: Play,
    whitepaper: FileText,
    other: LinkIcon,
} as const;
