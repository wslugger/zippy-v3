# **ARCHITECTURE\_v3.md \- Zippy Modular System Design**

## **🏗 High-Level Architecture: The Modular Pipeline**

Zippy v3 is a **Federated Monolith** built on Next.js and MongoDB. It abandons strict SQL-style relational joins in favor of **Contextual Embedding** to ensure historical projects remain immutable even when Admin catalogs change.  
graph TD  
    subgraph "Admin Domain (Independent Policy Service)"  
        Catalog\[(Equipment & Services)\]  
        Rules\[(BOM Logic Rules)\]  
        Taxonomy\[(Site Types & Metadata)\]  
    end

    subgraph "Project Ledger (MongoDB)"  
        Ledger\[(Project Document)\]  
    end

    subgraph "SA Flow (The Modules)"  
        M1\[Module 1: Ingestion & Package\]  
        M2\[Module 2: Design Customization\]  
        M3\[Module 3: BOM Engine\]  
        M4\[Module 4: HLD Generation\]  
    end

    %% Data Flow  
    M1 \<--\>|Read/Write State & Invalidations| Ledger  
    M2 \<--\>|Read/Write Customizations| Ledger  
    M3 \<--\>|Read/Write Embedded BOM| Ledger  
    Ledger \--\>|Read Finalized Data| M4  
      
    %% Admin Policy Lookups  
    M1 \-. Fetch Taxonomy & Packages .-\> AdminDomain  
    M3 \-. POST Context for BOM Resolution .-\> Rules  
    M3 \-. Fetch SKUs/Prices .-\> Catalog  
    M4 \-. Fetch Caveats & Assumptions .-\> Catalog

## **🧱 Data Model (MongoDB)**

### **1\. The Project Ledger (Collection: projects)**

The project document is the central state container. It uses **embedding** to ensure historical immutability and instant loading.  
{  
  "\_id": "proj\_123xyz",  
  "customerName": "Acme Corp",  
  "status": "draft",  
  "moduleStates": {  
    "ingestion": "completed",  
    "customization": "completed",  
    "bomGeneration": "out\_of\_date"  
  },  
  "sites": \[  
    {  
      "siteId": "site\_001",  
      "name": "HQ",  
      "requirements": { "users": 150, "bandwidthMbps": 1000 },  
      "classification": { "type": "Large Hub", "confidence": 0.98 }  
    }  
  \],  
  "selectedPackageId": "perf\_sase\_01",  
  "customizations": {  
    "topology": "hub\_and\_spoke",  
    "features": \["bgp", "advanced\_malware"\]  
  },  
  "bomSnapshot": \[  
    {  
      "siteId": "site\_001",  
      "serviceCategory": "managed\_sdwan",  
      "equipment": {  
        "sku": "meraki\_mx105",  
        "vendor": "Meraki",  
        "specs": { "throughputMbps": 3000 }  
      },  
      "quantity": 2,  
      "reasoning": "Rule Match: Requires HA. Throughput \> 1000Mbps.",  
      "pricing": { "unitNet": 3500.00, "mrc": 150.00 }  
    }  
  \]  
}

### **2\. Admin Policy Service (Collections: equipment, bom\_rules, metadata)**

The Admin database focuses on flexibility. There are NO hardcoded dropdowns or magic numbers in the frontend.

## **🔄 Core Data Flow Contracts**

1. **Iterative Invalidation:** If an SA changes sites in Module 1, the UI must intercept this update and set moduleStates.bomGeneration \= "out\_of\_date".  
2. **Stateless BOM Generation:** Module 3 (BOM) does NOT calculate hardware sizing locally. It passes the ledger's sites and customizations to the Admin Policy API, which resolves the rules and returns the fully populated bomSnapshot array to be saved in the Ledger.  
3. **AI-Stitched HLD Generation:** Module 4 does NOT generate HLD text from scratch (to avoid hallucinations). It reads the finalized BOM and customized services, queries the Admin Catalog for the exact description, assumptions, caveats, and constraints associated with those specific selections, and passes this structured JSON payload to the AI to generate conversational transition sentences and stitch the document together.