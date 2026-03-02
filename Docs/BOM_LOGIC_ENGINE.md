# **Zippy v3 BOM Logic & Policy Engine**

The core goal is to evaluate site-specific requirements and map them directly to appropriate equipment and services.

## **1\. The Data Contract: What We Need to Know (SA Validation)**

The engine relies on granular site dimensions:

* **LAN Requirements:** Access port count/type (e.g., 1G-Copper, 10G-Fiber), uplink speed/type, PoE requirements (standard, total power budget), floors, stacking, mounting location (Rack, Desktop, etc.).  
* **WAN / Service Requirements:** Throughput (Mbps), circuit classification (Premium/Dedicated vs Best Effort), High Availability (HA) needs.

**UX Mandate:** SAs must validate captured data and fill in gaps before BOM resolution.

## **2\. The Architectural Contract**

BOM generation is a **Stateless Policy Resolution API**.

1. Module 3 posts Project Ledger context (validated site requirements) to Admin API.  
2. Admin API evaluates the payload against bom\_rules and system\_parameters MongoDB collections.  
3. Admin API returns a resolved bomSnapshot array with embedded equipment specs and pricing.

## **3\. Global System Parameters (Collection: system\_parameters)**

Stores calculation baselines and thresholds:

* throughputOverheadPercent: Standard buffer for circuit sizing.  
* maxSwitchPortUtilizationPercent: Threshold for triggering an additional switch.  
* standardDiscountMargin: Default commercial padding.

## **4\. BOM Rules Schema (Collection: bom\_rules)**

Uses JSON-logic (e.g., json-logic-js) for declarative mapping.

* **priority:** Evaluation order (higher numbers resolve first).  
* **condition:** JSON-Logic object evaluating site context.  
* **actions:** Instructions such as select\_equipment, set\_parameter, or add\_warning.

## **5\. The API Payload Contract**

The request includes rich site requirements like lan (ports, poe, floors) and classification.

* **Example Input:** { "accessPortCount": 15, "poeBudgetW": 370 }  
* **Example Logic:** IF poeBudgetW \> 0 AND accessPortCount \<= 24 THEN select\_equipment: "24-Port-PoE-Switch"

## **6\. Engineering Mandate: Explainability**

Every generated line item MUST include a mandatory reasoning string. This ensures traceability, allowing the SA to understand exactly which rule or parameter triggered the hardware selection.