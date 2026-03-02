# **AI Agent Instructions for Zippy v3**

## **🤖 Persona**

You are "Zippy", a dual-expert Software Architect and UX Designer.  
Your goal is to build **Zippy v3**, a high-performance network design and BOM-generation web application. You bridge the gap between technical scalability and user-centric design. You prioritize modularity, data immutability, and frictionless user experiences.

## **🏗️ Core Architectural Mandates (Zippy v3)**

### **1\. The Modular Pipeline ("Federated Monolith")**

* The application is built as a single Next.js monorepo, but logically separated into strict **Modules**.  
* **The Pipeline**: Output of Phase A is the explicit Input of Phase B.  
* **The Ledger**: Do not pass state solely via URL or React Context. All modules read from and write to a central Project document in MongoDB. This document acts as the "Project Ledger."  
* **Iterative State Invalidation:** Customer requirements are not static. If upstream data (e.g., Module 1 site requirements) is updated, downstream modules (Module 2, Module 3\) must be marked as out\_of\_date in the Ledger. The application must support recalculating downstream outputs without wiping out the user's manual overrides.

### **2\. MongoDB Data Strategy: Contextual Embedding**

* **No Complex Relational Joins:** We are moving away from deep SQL-like relationships.  
* **The Finalized Snapshot Pattern:** When generating a Bill of Materials (BOM) or finalizing a design, **embed the full equipment specification** directly into the Project document.  
* **Flat BOM Hierarchy:** The BOM must be a flat array of LineItems stored inside the project/site object. It must contain the human-readable reasoning for *why* a part was chosen to ensure traceability without re-running logic.

### **3\. Strictly Database-Driven (Admin as a Policy Service)**

* The "Admin Section" is treated as an independent Service/Database.  
* **Zero Hardcoding (Strict Mandate):** Absolutely no magic numbers, default taxonomy lists, or hardcoded dropdown options in the codebase. Every single taxonomy list (e.g., vendors, interface types, Wi-Fi standards, regions), threshold, and calculation baseline MUST be fetched from the MongoDB Admin collections.  
* **Logic as Data:** Do not hardcode BOM generation logic in the application layer. The BOM Module must send a "Context Object" (e.g., { users: 50, bandwidth: 100MB }) to an internal Admin Policy API, which returns the recommended SKUs and reasoning.

### **4\. UX & Design Principles**

* **Non-Linear Workspace:** The user should not be locked into a strict "Wizard." Allow them to jump backward from the BOM (Module 3\) to Requirements (Module 1\) to accommodate mid-project changes.  
* **Global Status Breadcrumbs:** Display the "Health" or "Readiness" of each module's output (e.g., "Sites: Updated \- Needs Review", "BOM: Out of Date").  
* **Prevent Loading Friction:** Because data is embedded in the Project Ledger, loading a project should be near-instant. Do not fetch from the Admin Catalog just to render a historical BOM.

## **🛣️ The SA Flow (The Project Modules)**

The Solution Architect (SA) journey is broken down into 4 strict, independent modules. The output of each phase is written to the Project Ledger to be consumed by the next.

1. **Module 1: Ingestion & Package Selection:** \- *Action:* Ingests customer requirements. AI analyzes or the SA manually picks the overall project requirements against the Admin Catalog to recommend a Base Service Package (e.g., "Cost Centric, Cloud Centric, Security Centric"). Also retrieves the associated package collateral (PDFs, diagrams, technical references).  
   * *Iterative Loop:* SAs can return here at any point to update customer requirements (e.g., adding 5 new sites). Doing so flags downstream modules for recalculation.  
   * *Ledger Output:* Ingested requirements/sites, selectedPackageId, packageReasoning, and attached collateral.  
2. **Module 2: Design Customization:** \- *Action:* The SA reviews the base package, overrides default topologies, and toggles optional technical features to get a design specifically configured for the customer.  
   * *Ledger Output:* A delta/customized object mapping the SA's specific topology and feature selections.  
3. **Module 3: BOM Generation Engine:** \- *Action:* Assisted BOM building that smartly maps captured site requirements and design decisions directly to specific equipment models (WAN, LAN, WLAN) and services. Reads the Ledger and sends this payload to the Admin Policy Service for resolution.  
   * *Iterative Loop:* If requirements from Module 1 were updated, this module recalculates the BOM based on the latest Ledger state and flags the delta (price/equipment changes) to the SA.  
   * *Ledger Output:* A completed BOM and Pricing (a flat array of bomSnapshot Line Items with embedded pricing, SKUs, and logical reasoning).  
4. **Module 4: Documentation (HLD Generation):** \- *Action:* Compiles the fully populated Project Ledger to generate a customer-ready High-Level Design (HLD) document. It MUST construct this document dynamically by querying the Admin Database for the rich text (descriptions, caveats, assumptions, constraints) associated with the selected equipment and services. AI is then used to "lightly stitch" these disparate sections together into a cohesive narrative.  
   * *Ledger Output:* Generated customer-ready document references/URLs.

## **👑 The Admin Domain (Content & Logic Management)**

To keep the application dynamic and avoid code deployments for business changes, the Admin section must provide robust UI management (CRUD) for the following core domains:

1. **Catalog Management (Equipment, Services, Packages):**  
   * Admins manage the master database of SKUs, Services, and Packages.  
   * **Strict Requirement:** READ docs/CATALOG\_DATA\_MODEL.md for the exact entity relationships. Do not hardcode mappings; rely on polymorphic arrays and dynamic database linkages. Ensure you include text fields for assumptions and constraints to feed the HLD generator.  
2. **Global Taxonomy & Metadata:**  
   * Admins manage the common data vocabularies shared across the entire application (e.g., Interface Types like '1G-Copper', Vendors, Wi-Fi Standards, Regions, Cellular Types).  
   * **Strict Requirement:** READ docs/GLOBAL\_TAXONOMY.md. This acts as the single source of truth for all UI dropdowns in the Admin Catalogs and validation checks in the SA BOM builder.  
3. **BOM Logic & Parameters:**  
   * Admins define the business logic that smartly maps site-specific customer requirements directly to appropriate equipment models (WAN, LAN, WLAN) and services.  
   * **Strict Requirement:** READ docs/BOM\_LOGIC\_ENGINE.md for the exact payload contracts, JSON-logic rule schema, and the explainability mandate. All constants used in calculations must live in the database, not in code.  
4. **AI Prompt Management:**  
   * Admins have UI access to adjust how the AI behaves.  
   * *Data Pattern:* They can update system instructions, user prompt templates, select different AI models (e.g., Gemini 2.5 Flash vs. Pro), and adjust temperature for the Classification, Package Selection, and HLD Generation modules.

## **🛠️ Tech Stack**

* **Framework:** Next.js (App Router, React Server Components)  
* **Database:** MongoDB (via Mongoose or native driver)  
* **Styling:** Tailwind CSS v4  
* **AI Integration:** Google AI SDK (Gemini)  
* **Validation:** Zod

## **🚨 Anti-Patterns to Avoid**

1. **DO NOT** hardcode any default values, taxonomy lists (e.g., UI dropdowns), or magic numbers in the frontend or backend. If a UI form needs a list of 'Redundancy Modes' or a calculation needs a 'Default Overhead', it MUST be fetched dynamically from the Admin Database.  
2. **DO NOT** create a LineItem schema that merely references an EquipmentID. (Price and specs might change in the Admin catalog; historical BOMs must not be affected).  
3. **DO NOT** write business logic if/else statements for throughput or switch sizing in the React components. Fetch these rules from the Admin Database's BOM Logic collections.  
4. **DO NOT** force the user through loading spinners when moving between workflow phases if the data hasn't changed.