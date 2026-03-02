# **Zippy v3 Catalog Data Model**

This document outlines the strict database architecture for the Admin Catalog. Because Zippy is a zero-hardcoding platform, the relationships between hardware, services, and packages must be highly flexible and dynamic.

Crucially, **these catalogs act as the source of truth for the HLD Document Generator**, so they must contain rich text fields for descriptions, caveats, assumptions, and constraints.

## **1\. Equipment Catalog**

The equipment catalog stores all physical and virtual hardware SKUs.

* **Lean Actionable Specs Mandate:** The specs object must ONLY contain fields that are actively evaluated by the BOM Logic Engine. Do not bloat this object with exhaustive datasheet specifications.  
* **Target "Actionable" Fields:** \* throughputMbps: Rated capacity for WAN/SD-WAN devices.  
  * accessPortCount: Number of LAN ports available for users.  
  * accessPortType: Standard of ports (e.g., 1G-Copper, 10G-Fiber).  
  * uplinkSpeed: Speed of the uplink ports (e.g., 10Gbps).  
  * poeBudgetW: Total PoE wattage available.  
  * poeStandard: Supported standard (e.g., PoE+ / UPoE).  
  * stackingSupport: Boolean indicating if the model supports hardware stacking.  
  * formFactor: Physical size (e.g., 1U Rack, Desktop, Wall-mount, rugged).  
* **Datasheet Reference:** To allow the Solution Architect (SA) to verify complex, non-actionable details during BOM generation, every equipment document must include a datasheetUrl linking to the official vendor documentation.  
* **Polymorphic Specs:** Equipment specifications must use a flexible schema (e.g., Mixed in Mongoose) to accommodate vastly different tech specs without rigid database migrations.  
* **Purpose & Service Linkage:**  
  * Every piece of equipment has a primaryServiceCategory (e.g., Managed SD-WAN, LAN, WLAN).  
  * **Dynamic Linkage:** Equipment MUST be linked to Services via an array of supportedServiceIds.  
* **Pricing & Management Tiering:** Equipment will have a hardware purchase price and a managementSize attribute (e.g., XS, S, M, L, XL) for recurring management cost calculation.   
* **HLD Text Blocks:** Contains specific description, caveats, and assumptions arrays to inform the HLD generator.

### **Example Document Shape**

{  
  "\_id": "equip\_meraki\_mx105",  
  "vendor": "Meraki",   
  "model": "MX105",  
  "primaryServiceCategory": "Managed SD-WAN",  
  "supportedServiceIds": \["svc\_managed\_sdwan", "svc\_dedicated\_internet"\],  
  "managementSize": "M",   
  "datasheetUrl": "\[https://meraki.cisco.com/product-collateral/mx-family-datasheet/\](https://meraki.cisco.com/product-collateral/mx-family-datasheet/)",  
  "specs": {  
    "throughputMbps": 3000,  
    "wanPortCount": 2,  
    "formFactor": "1U Rack"  
  },  
  "hldText": {  
    "description": "High-performance SD-WAN appliance designed for medium to large branches.",  
    "assumptions": \["Requires 1U of available rack space."\],  
    "caveats": \["Maximum crypto throughput is rated at 3Gbps under optimal conditions."\]  
  },  
  "pricing": {  
    "listPrice": 4500.00,  
    "effectiveDate": "2025-01-01T00:00:00Z"  
  }  
}

## **2\. Services Catalog**

Services define *what* Zippy is delivering (e.g., "Managed SD-WAN", "MPLS").

* **Service Hierarchy:** Services contain configurations toggled in Module 2\.  
* **Service Options & Design Options:** Services have ServiceOptions which have DesignOptions.  
* **Feature Inheritance:** Service Options inherit features from their parent Service.  
* **HLD Text Blocks:** Source of truth for descriptions and constraints.

## **3\. Package Catalog (The Bundles)**

Packages represent the high-level bundles selected in Module 1\.

* **Composition:** Strictly bundles of *Services*, *Design Options*, and *Features*.  
* **Inclusion Logic:** Services defined as required, standard, or optional.  
* **Collateral:** Array of collateral objects (URLs to PDFs, diagrams).

## **4\. Site Profiles**

Standardized templates to quickly classify customer locations. Defines baseline assumptions (e.g., "Gold Site").

## **📝 General Data Mandate**

When building schemas or working with this data, always rely on standard string identifiers or ObjectIds to link documents. Avoid deep nesting across collections. The hldText blocks must be preserved and easily extractable for Module 4\.

