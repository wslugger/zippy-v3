# **Zippy v3 Global Taxonomy Data Model**

This document outlines how Zippy handles common data vocabularies. To enforce the **Zero Hardcoding** mandate, all shared arrays, dropdown options, and standardized terms must live in this MongoDB configuration.

## **1\. The Global Taxonomy Document**

The taxonomy is managed as a **Singleton Document** in MongoDB collection system\_config.  
{  
  "\_id": "global\_taxonomy\_v1",  
  "vendors": \["Cisco Catalyst", "Meraki", "HPE Aruba"\],  
  "purposes": \["WAN", "LAN", "WLAN", "SECURITY"\],  
  "interfaceTypes": \[  
    "1G-Copper",   
    "mGig-Copper",   
    "10G-Copper",   
    "1G-Fiber",   
    "10G-Fiber",   
    "25G-Fiber",   
    "40G-Fiber",   
    "100G-Fiber"  
  \],  
  "wifiStandards": \["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"\],  
  "cellularTypes": \["LTE", "5G", "LTE/5G"\],  
  "poeStandards": \["None", "PoE+", "PoE++", "UPoE"\],  
  "mountingOptions": \["Rack", "Wall", "Desktop", "Ceiling"\]  
}

## **2\. Cross-Module Usage**

The data in this singleton document connects the entire platform for Admin managers, SA BOM Builder (Module 3), and Admin BOM Logic Engine.

## **3\. Engineering Mandate**

* Create a React hook or Server Action to fetch and cache this singleton.  
* Use exclusively for UI standardized options.  
* Provide an Admin UI page for adding/removing taxonomy terms.