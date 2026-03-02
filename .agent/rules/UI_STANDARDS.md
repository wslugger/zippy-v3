# **Zippy v3 UI & UX Standards Blueprint**

This document outlines the strict UI component choices, design system rules, and UX heuristics for the Zippy v3 frontend. The primary goal is to maintain a high-density, lightning-fast B2B interface that perfectly integrates with our dynamic MongoDB architecture.

## **1\. The Component Tech Stack**

Zippy v3 relies on the "Owned Code" pattern to ensure we have total control over how components interact with our database taxonomies.

* **CSS Framework:** Tailwind CSS v4.  
* **Component Library:** shadcn/ui (built on Radix UI primitives).  
* **Mandate:** **DO NOT** install opinionated component libraries like Material UI (MUI), Ant Design, or Bootstrap.  
* **Implementation Rule:** When Claude is instructed to build a UI element (e.g., a dropdown), it should generate the raw shadcn/ui Tailwind/Radix code rather than abstracting it behind a rigid NPM package. This allows us to inject our GLOBAL\_TAXONOMY directly into the component logic.

## **2\. UX Design Principles & Heuristics**

Zippy is a highly technical tool. The UI must prioritize speed, readability, and traceablity over flashy aesthetics.

### **A. Progressive Disclosure (Module 2 \- Customization)**

Do not overwhelm the Solution Architect (SA) with every possible configuration at once.

* Use **Accordions** or **Collapsible Cards** for advanced networking features.  
* Only reveal granular settings (e.g., "BGP ASNs", "Secondary PoE Budgets") if the SA toggles an "Advanced Mode" or explicitly opts into a feature.

### **B. High Data Density & Typography (Module 3 \- BOM Table)**

The BOM Engine generates massive lists of equipment.

* **Dense Tables:** Tables must use tight padding (e.g., p-2 or p-1) to maximize screen real estate.  
* **Monospaced Numerics:** All numerical data (Pricing, Port Counts, Bandwidth Mbps, Quantities) MUST use tabular/monospaced font settings (e.g., tabular-nums in Tailwind) so that columns align perfectly for easy scanning.

### **C. Explainability & Traceability UI**

As defined in BOM\_LOGIC\_ENGINE.md, every piece of equipment generated in the BOM comes with a reasoning string.

* **The Rule:** The UI must display this reasoning.  
* **The Pattern:** Use a standardized \<Tooltip\> or a clickable \[ i \] Info Popover next to the SKU name in the BOM table. SAs must never have to guess why the engine selected a specific part.

### **D. Semantic State Colors**

Color must be used to communicate the moduleStates from the Project Ledger, not just for decoration.

* **Green (bg-green-500/text-green-700):** Completed / Validated.  
* **Amber/Yellow (bg-amber-500/text-amber-700):** Out of Date / Needs Recalculation (e.g., when Module 1 data changes and Module 3 needs a refresh).  
* **Red (bg-red-500/text-red-700):** Error / Missing critical requirements.

## **3\. The "Zero Hardcoding" UI Implementation**

When building forms or data displays, the UI must act strictly as a presentation layer for the system\_config (Taxonomy) and equipment catalogs.

* **Forms & Dropdowns:** If building a \<Select\> component for "Interface Type" or "Vendor", the \<SelectOption\> items **MUST NOT** be hardcoded strings in the React component. They must map over the arrays fetched from the Global Taxonomy document.  
* **Loading States:** Because data is embedded in the Project Ledger, loading a finalized project should be near-instant. Do not use full-page loading spinners unless actively awaiting a response from the Admin Policy API for a new calculation. Use Skeleton loaders (animate-pulse) for granular component loading.