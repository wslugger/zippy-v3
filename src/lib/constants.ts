// UI-only presentation constants. NOT business data.
// Business data comes from MongoDB (zero-hardcoding mandate).

export const MODULE_LABELS = {
  ingestion: "Ingestion & Package",
  configuration: "Design Configuration",
  bomGeneration: "BOM Generation",
  hldGeneration: "HLD Generation",
} as const;

export const MODULE_STATE_COLORS = {
  not_started: { bg: "bg-zinc-100", text: "text-zinc-500", label: "Not Started" },
  pending: { bg: "bg-blue-50", text: "text-blue-600", label: "Pending" },
  locked: { bg: "bg-zinc-200", text: "text-zinc-500", label: "Locked" },
  in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
  out_of_date: { bg: "bg-amber-100", text: "text-amber-700", label: "Out of Date" },
  error: { bg: "bg-red-100", text: "text-red-700", label: "Error" },
} as const;

export const COLLATERAL_TYPE_ICONS = {
  PDF: "FileText",
  Diagram: "Network",
  Reference: "BookOpen",
} as const;

export const INCLUSION_COLORS = {
  required: { bg: "bg-primary", text: "text-primary-foreground" },
  standard: { bg: "bg-secondary", text: "text-secondary-foreground" },
  optional: { bg: "bg-muted", text: "text-muted-foreground" },
} as const;
