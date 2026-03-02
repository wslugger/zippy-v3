import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data for idempotent seeding
  await prisma.package.deleteMany();
  await prisma.service.deleteMany();
  await prisma.globalTaxonomy.deleteMany();

  // 1. Create Global Taxonomy singleton
  await prisma.globalTaxonomy.create({
    data: {
      slug: "global_taxonomy_v1",
      vendors: ["Cisco Catalyst", "Meraki", "HPE Aruba", "Fortinet", "Palo Alto"],
      purposes: ["WAN", "LAN", "WLAN", "SECURITY"],
      interfaceTypes: [
        "1G-Copper", "mGig-Copper", "10G-Copper",
        "1G-Fiber", "10G-Fiber", "25G-Fiber", "40G-Fiber", "100G-Fiber",
      ],
      wifiStandards: ["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"],
      cellularTypes: ["LTE", "5G", "LTE/5G"],
      poeStandards: ["None", "PoE+", "PoE++", "UPoE"],
      mountingOptions: ["Rack", "Wall", "Desktop", "Ceiling"],
    },
  });

  // 2. Create Services
  const sdwan = await prisma.service.create({
    data: {
      slug: "managed_sdwan",
      name: "Managed SD-WAN",
      shortDescription: "Software-defined WAN with centralized orchestration.",
      description: "Enterprise SD-WAN service providing application-aware routing, automated failover, and centralized policy management across all branch sites.",
      constraints: [
        "BGP integration requires a dedicated management VLAN.",
        "Maximum 500 sites per SD-WAN fabric instance.",
      ],
      assumptions: [
        "All sites have at least one active internet circuit.",
        "Minimum 10 Mbps bandwidth per site for overlay control plane.",
      ],
      features: ["application_aware_routing", "wan_optimization", "bgp", "dynamic_path_selection"],
      serviceOptions: [
        {
          optionId: "cisco_catalyst_sdwan",
          name: "Cisco Catalyst SD-WAN",
          shortDescription: "Cisco's enterprise SD-WAN platform (formerly Viptela).",
          description: "Cisco Catalyst SD-WAN uses vManage for centralized management with vSmart controllers and vEdge/cEdge routers providing secure overlay connectivity.",
          constraints: ["Requires vManage controller (cloud or on-prem).", "Firmware must be aligned across all edge devices."],
          assumptions: ["vManage license included with service.", "Cloud-hosted controller unless on-prem specified."],
          features: ["seg_routing", "cflowd_analytics", "omp_routing"],
          designOptions: [
            {
              groupId: "topology",
              groupLabel: "Topology",
              shortDescription: "WAN overlay topology between sites.",
              description: "Defines how sites interconnect over the SD-WAN overlay. Topology choice impacts latency, resilience, and cost.",
              constraints: ["Full mesh requires additional bandwidth overhead."],
              assumptions: ["Hub sites have sufficient bandwidth for aggregated spoke traffic."],
              selectionType: "single",
              choices: [
                { value: "hub_spoke_strict", label: "Hub & Spoke (Strict)", shortDescription: "All spoke traffic routes through hub.", description: "All inter-site traffic is funneled through a central hub. Simplest policy model.", constraints: ["Single point of failure at hub site."], assumptions: ["Hub site has redundant circuits."] },
                { value: "hub_spoke_dynamic", label: "Hub & Spoke (Dynamic)", shortDescription: "Dynamic direct spoke-to-spoke tunnels.", description: "Default hub-and-spoke with dynamic direct tunnels between spokes for latency-sensitive traffic.", constraints: ["Increases control plane overhead."], assumptions: ["Edge devices support dynamic tunnel creation."] },
                { value: "full_mesh", label: "Full Mesh", shortDescription: "Direct connectivity between all sites.", description: "Every site has a direct tunnel to every other site. Lowest latency but highest complexity.", constraints: ["Tunnel count scales as n*(n-1)/2.", "Not recommended for >50 sites."], assumptions: ["All sites have sufficient bandwidth for multiple tunnels."] },
              ],
            },
            {
              groupId: "internet_breakout",
              groupLabel: "Internet Breakout",
              shortDescription: "Where internet-bound traffic exits the overlay.",
              description: "Determines whether internet traffic is backhauled to a central site for inspection or breaks out locally at each branch.",
              constraints: ["Local breakout requires security stack at each site."],
              assumptions: ["Central breakout uses hub site firewall."],
              selectionType: "single",
              choices: [
                { value: "central", label: "Central", shortDescription: "All internet via hub site.", description: "Internet traffic backhauled to central site for inspection and egress.", constraints: ["Adds latency for SaaS applications."], assumptions: ["Hub site firewall can handle aggregated traffic."] },
                { value: "local", label: "Local", shortDescription: "Direct internet at each branch.", description: "Each site breaks out internet traffic locally, reducing latency for cloud applications.", constraints: ["Requires local security policy enforcement."], assumptions: ["Each site has a local firewall or cloud security service."] },
              ],
            },
          ],
        },
        {
          optionId: "meraki_sdwan",
          name: "Meraki SD-WAN",
          shortDescription: "Cloud-managed SD-WAN with simplified operations.",
          description: "Meraki SD-WAN leverages the Meraki dashboard for cloud-first management with MX appliances providing secure SD-WAN connectivity.",
          constraints: ["Dashboard license required per device.", "Limited BGP support compared to Catalyst."],
          assumptions: ["Meraki dashboard access provisioned at deployment.", "Cloud management plane accessible from all sites."],
          features: ["auto_vpn", "traffic_shaping", "cloud_management"],
          designOptions: [
            {
              groupId: "topology",
              groupLabel: "Topology",
              shortDescription: "Auto VPN topology between sites.",
              description: "Meraki Auto VPN topology defines how sites connect. Hub-and-spoke is the default; full mesh creates direct tunnels.",
              constraints: ["Full mesh limited to 100 spokes per hub."],
              assumptions: ["Auto VPN configured via Meraki dashboard."],
              selectionType: "single",
              choices: [
                { value: "hub_spoke", label: "Hub & Spoke", shortDescription: "Spoke traffic routes through hub(s).", description: "Standard Meraki Auto VPN with spokes connecting through designated hub sites.", constraints: ["Hub device sizing must account for aggregated spoke traffic."], assumptions: ["At least one hub site designated."] },
                { value: "full_mesh", label: "Full Mesh", shortDescription: "Direct tunnels between all sites.", description: "All sites establish direct VPN tunnels, reducing latency for site-to-site traffic.", constraints: ["Not recommended for large deployments."], assumptions: ["All sites have adequate uplink bandwidth."] },
              ],
            },
            {
              groupId: "internet_breakout",
              groupLabel: "Internet Breakout",
              shortDescription: "Internet egress strategy.",
              description: "Controls how internet-bound traffic is handled across the Meraki SD-WAN fabric.",
              constraints: [],
              assumptions: ["Meraki content filtering available at all sites."],
              selectionType: "single",
              choices: [
                { value: "central", label: "Central", shortDescription: "Backhaul to hub for internet.", description: "All internet traffic backhauled to hub for centralized inspection.", constraints: ["Increased WAN bandwidth consumption."], assumptions: ["Hub has sufficient internet capacity."] },
                { value: "local", label: "Local", shortDescription: "Local internet breakout per site.", description: "Each site accesses internet directly with Meraki content filtering and threat protection.", constraints: [], assumptions: ["Meraki Advanced Security license applied per site."] },
              ],
            },
          ],
        },
      ],
    },
  });

  const lan = await prisma.service.create({
    data: {
      slug: "managed_lan",
      name: "Managed LAN",
      shortDescription: "Enterprise LAN switching with centralized management.",
      description: "Fully managed enterprise LAN infrastructure providing switching, PoE, and access control with automated provisioning and monitoring.",
      constraints: ["Stacking limited to 8 members per stack.", "Mixed vendor stacking not supported."],
      assumptions: ["Standard Cat6a cabling to each access port.", "Dedicated management VLAN available."],
      features: ["802.1x", "dynamic_vlan", "qos", "macsec"],
      serviceOptions: [
        {
          optionId: "cisco_catalyst_switching",
          name: "Cisco Catalyst Switching",
          shortDescription: "Enterprise-grade Catalyst switches with IOS-XE.",
          description: "Cisco Catalyst 9000 series switches providing high-performance LAN access with advanced security and automation through DNA Center.",
          constraints: ["DNA Center license required for automation features.", "ISSU supported on select models only."],
          assumptions: ["DNA Advantage license included.", "Switches deployed with IOS-XE 17.x or later."],
          features: ["stackwise_virtual", "dna_center", "trustworthy_solutions"],
          designOptions: [
            {
              groupId: "redundancy_mode",
              groupLabel: "Redundancy Mode",
              shortDescription: "Switch redundancy and high-availability model.",
              description: "Defines how switches achieve redundancy. Stacking bonds multiple switches as one logical unit; standalone relies on STP.",
              constraints: ["Stacking cables required for physical stacking."],
              assumptions: ["All stack members are same model family."],
              selectionType: "single",
              choices: [
                { value: "stacking", label: "Switch Stacking", shortDescription: "Physical switch stacking via StackWise.", description: "Multiple switches operate as a single logical switch with unified management and shared control plane.", constraints: ["Maximum 8 members per stack."], assumptions: ["StackWise cables provided."] },
                { value: "standalone", label: "Standalone", shortDescription: "Individual switches with STP.", description: "Each switch operates independently with Spanning Tree Protocol providing loop prevention.", constraints: ["STP convergence may cause brief outages during failover."], assumptions: ["RSTP or MST configured for fast convergence."] },
              ],
            },
            {
              groupId: "management_model",
              groupLabel: "Management Model",
              shortDescription: "How switches are managed and monitored.",
              description: "The management platform used for switch configuration, monitoring, and policy deployment.",
              constraints: [],
              assumptions: [],
              selectionType: "single",
              choices: [
                { value: "dna_center", label: "DNA Center (On-Prem)", shortDescription: "Cisco DNA Center for intent-based networking.", description: "On-premises DNA Center appliance providing automation, assurance, and policy management.", constraints: ["Requires dedicated DNA Center appliance."], assumptions: ["DNA Center appliance provisioned and licensed."] },
                { value: "cli_managed", label: "CLI / Traditional", shortDescription: "Direct CLI management via SSH.", description: "Traditional switch management via CLI with optional SNMP monitoring.", constraints: ["Manual configuration across all switches."], assumptions: ["Network management system (NMS) deployed for monitoring."] },
              ],
            },
          ],
        },
        {
          optionId: "meraki_switching",
          name: "Meraki Switching",
          shortDescription: "Cloud-managed switches with simplified operations.",
          description: "Meraki MS series switches with cloud-based dashboard management, zero-touch provisioning, and integrated analytics.",
          constraints: ["Dashboard license required per switch.", "Limited CLI access by design."],
          assumptions: ["Meraki dashboard accessible from management network.", "Enterprise license level applied."],
          features: ["cloud_management", "zero_touch", "adaptive_policy"],
          designOptions: [
            {
              groupId: "redundancy_mode",
              groupLabel: "Redundancy Mode",
              shortDescription: "Switch redundancy model.",
              description: "How Meraki switches achieve high availability. Virtual stacking provides a unified management view without physical stacking.",
              constraints: [],
              assumptions: ["Virtual stacking configured via dashboard."],
              selectionType: "single",
              choices: [
                { value: "physical_stacking", label: "Physical Stacking", shortDescription: "Hardware stacking for Meraki MS switches.", description: "Physical stacking for select MS models providing unified control plane.", constraints: ["Only supported on MS390 and MS410 series."], assumptions: ["Stacking cables included."] },
                { value: "standalone", label: "Standalone", shortDescription: "Individual switches managed via dashboard.", description: "Each switch managed independently through Meraki dashboard with virtual stacking for logical grouping.", constraints: [], assumptions: ["Dashboard provides unified view across all switches."] },
              ],
            },
          ],
        },
      ],
    },
  });

  const wlan = await prisma.service.create({
    data: {
      slug: "managed_wlan",
      name: "Managed WLAN",
      shortDescription: "Enterprise wireless with cloud-managed access points.",
      description: "Cloud-managed wireless access with enterprise-grade security, RF optimization, and location analytics for all site types.",
      constraints: ["Wi-Fi 7 requires compatible client devices for full throughput.", "Maximum 500 APs per wireless controller."],
      assumptions: ["Minimum ceiling height of 2.7m for optimal AP placement.", "PoE+ or PoE++ available at each AP location."],
      features: ["captive_portal", "rf_optimization", "location_analytics", "wpa3"],
      serviceOptions: [
        {
          optionId: "meraki_wireless",
          name: "Meraki Wireless",
          shortDescription: "Cloud-managed Meraki MR access points.",
          description: "Meraki MR series access points with cloud-managed RF optimization, seamless roaming, and integrated analytics via the Meraki dashboard.",
          constraints: ["Dashboard license per AP required.", "Air Marshal requires Advanced Security license."],
          assumptions: ["Meraki dashboard accessible.", "Enterprise license applied."],
          features: ["air_marshal", "auto_rf", "seamless_roaming"],
          designOptions: [
            {
              groupId: "wifi_standard",
              groupLabel: "Wi-Fi Standard",
              shortDescription: "Wireless standard for access points.",
              description: "The Wi-Fi generation deployed. Higher standards provide better throughput and efficiency but require compatible infrastructure.",
              constraints: [],
              assumptions: ["Client devices support selected standard."],
              selectionType: "single",
              choices: [
                { value: "wifi6", label: "Wi-Fi 6", shortDescription: "802.11ax standard.", description: "Wi-Fi 6 (802.11ax) providing OFDMA and MU-MIMO for high-density environments.", constraints: [], assumptions: ["PoE+ sufficient for Wi-Fi 6 APs."] },
                { value: "wifi6e", label: "Wi-Fi 6E", shortDescription: "Wi-Fi 6 extended to 6 GHz.", description: "Wi-Fi 6E adds 6 GHz band for additional channels and reduced interference.", constraints: ["6 GHz band requires regulatory approval in some regions."], assumptions: ["PoE++ recommended for 6E APs."] },
                { value: "wifi7", label: "Wi-Fi 7", shortDescription: "Next-gen 802.11be standard.", description: "Wi-Fi 7 (802.11be) with multi-link operation, 4K-QAM, and 320 MHz channels.", constraints: ["Limited client device support currently.", "Requires PoE++ power."], assumptions: ["Future-proofing deployment for next-gen clients."] },
              ],
            },
            {
              groupId: "ap_density",
              groupLabel: "AP Density",
              shortDescription: "Access point deployment density.",
              description: "Determines the number of APs per area. Higher density improves capacity in crowded environments.",
              constraints: [],
              assumptions: [],
              selectionType: "single",
              choices: [
                { value: "standard", label: "Standard Density", shortDescription: "Coverage-focused deployment.", description: "APs placed for coverage with approximately 1 AP per 2,500 sq ft.", constraints: [], assumptions: ["Average user density of 30 users per AP."] },
                { value: "high", label: "High Density", shortDescription: "Capacity-focused deployment.", description: "APs placed for capacity with approximately 1 AP per 1,200 sq ft for high-traffic areas.", constraints: ["Increased PoE budget required."], assumptions: ["Conference rooms and open offices require high density."] },
              ],
            },
          ],
        },
        {
          optionId: "catalyst_wireless",
          name: "Cisco Catalyst Wireless",
          shortDescription: "Controller-based enterprise wireless with Catalyst APs.",
          description: "Cisco Catalyst 9800 wireless controllers with Catalyst 9100 series APs providing enterprise-grade wireless with DNA Center integration.",
          constraints: ["Wireless controller required (physical or virtual).", "DNA Center recommended for full feature set."],
          assumptions: ["Catalyst 9800 controller deployed.", "DNA Advantage license applied."],
          features: ["cleanair", "fastlane", "dna_spaces"],
          designOptions: [
            {
              groupId: "wifi_standard",
              groupLabel: "Wi-Fi Standard",
              shortDescription: "Wireless standard selection.",
              description: "Wi-Fi generation for the Catalyst wireless deployment.",
              constraints: [],
              assumptions: [],
              selectionType: "single",
              choices: [
                { value: "wifi6", label: "Wi-Fi 6", shortDescription: "Catalyst 9120/9130 APs.", description: "Wi-Fi 6 with Catalyst 9120/9130 access points.", constraints: [], assumptions: [] },
                { value: "wifi6e", label: "Wi-Fi 6E", shortDescription: "Catalyst 9136/9162 APs.", description: "Wi-Fi 6E with Catalyst 9136/9162 access points supporting 6 GHz.", constraints: [], assumptions: [] },
              ],
            },
          ],
        },
      ],
    },
  });

  const security = await prisma.service.create({
    data: {
      slug: "managed_security",
      name: "Managed Security (SASE)",
      shortDescription: "Converged networking and security as a cloud service.",
      description: "Secure Access Service Edge combining SD-WAN with cloud-delivered security functions including NGFW, IPS, CASB, and ZTNA.",
      constraints: [
        "Latency-sensitive applications may require local breakout exceptions.",
        "CASB requires API integration with SaaS providers.",
      ],
      assumptions: [
        "All branch traffic will be inspected via cloud security PoPs.",
        "Identity provider (IdP) integration for ZTNA.",
      ],
      features: ["ngfw", "ips", "advanced_malware", "casb", "ztna"],
      serviceOptions: [
        {
          optionId: "cisco_secure_connect",
          name: "Cisco+ Secure Connect",
          shortDescription: "Cisco's unified SASE platform.",
          description: "Cisco+ Secure Connect delivers converged networking and security with Meraki SD-WAN and Umbrella cloud security.",
          constraints: ["Requires Meraki MX at each site.", "Umbrella DNS and SIG licenses required."],
          assumptions: ["Cisco Umbrella cloud infrastructure used for security inspection.", "Meraki SD-WAN deployed as underlay."],
          features: ["umbrella_sig", "duo_ztna", "thousandeyes"],
          designOptions: [
            {
              groupId: "security_tier",
              groupLabel: "Security Tier",
              shortDescription: "Level of security inspection.",
              description: "Defines the depth of security services applied to traffic.",
              constraints: [],
              assumptions: [],
              selectionType: "single",
              choices: [
                { value: "essentials", label: "Essentials (FW + IPS)", shortDescription: "Firewall and intrusion prevention.", description: "Basic NGFW with IPS for network-level threat prevention.", constraints: [], assumptions: ["Sufficient for standard compliance requirements."] },
                { value: "advanced", label: "Advanced (FW + IPS + Malware)", shortDescription: "Adds advanced malware protection.", description: "Includes NGFW, IPS, and advanced malware analysis with sandboxing.", constraints: ["Sandboxing adds latency to file transfers."], assumptions: ["File analysis performed in cloud."] },
                { value: "premium", label: "Premium (Full SASE Stack)", shortDescription: "Complete SASE with CASB and ZTNA.", description: "Full security stack: NGFW, IPS, advanced malware, CASB, DLP, and ZTNA.", constraints: ["Requires IdP integration for ZTNA.", "CASB API connectors per SaaS app."], assumptions: ["Organization uses Azure AD or Okta as IdP."] },
              ],
            },
            {
              groupId: "inspection_mode",
              groupLabel: "Inspection Mode",
              shortDescription: "Where security inspection occurs.",
              description: "Determines whether traffic is inspected in the cloud or at the local site.",
              constraints: [],
              assumptions: [],
              selectionType: "single",
              choices: [
                { value: "cloud", label: "Cloud Inspection", shortDescription: "All traffic inspected via cloud PoP.", description: "Traffic tunneled to nearest Umbrella cloud PoP for inspection.", constraints: ["Adds 5-15ms latency depending on PoP proximity."], assumptions: ["Umbrella PoP within acceptable latency radius."] },
                { value: "local_breakout", label: "Local Breakout (Trusted Apps)", shortDescription: "Trusted apps bypass cloud inspection.", description: "Defined trusted applications break out locally; all other traffic inspected in cloud.", constraints: ["Trusted app list must be maintained."], assumptions: ["Microsoft 365 and Webex designated as trusted."] },
              ],
            },
          ],
        },
        {
          optionId: "fortinet_sase",
          name: "Fortinet SASE",
          shortDescription: "Fortinet's converged SASE platform.",
          description: "FortiSASE delivers SD-WAN and security through FortiGate appliances and FortiGuard cloud services.",
          constraints: ["FortiGate firmware alignment required across sites.", "FortiManager recommended for large deployments."],
          assumptions: ["FortiGuard subscription active.", "FortiAnalyzer deployed for logging."],
          features: ["fortigate_ngfw", "fortiguard_ai", "fortimanager"],
          designOptions: [
            {
              groupId: "security_tier",
              groupLabel: "Security Tier",
              shortDescription: "FortiGuard security bundle.",
              description: "Defines which FortiGuard security services are activated.",
              constraints: [],
              assumptions: [],
              selectionType: "single",
              choices: [
                { value: "essentials", label: "Essentials", shortDescription: "UTM bundle with FW + IPS + AV.", description: "FortiGuard UTM bundle: firewall, IPS, antivirus, and web filtering.", constraints: [], assumptions: [] },
                { value: "advanced", label: "Advanced", shortDescription: "Enterprise bundle with sandbox.", description: "Enterprise bundle adding sandboxing, email filtering, and industrial security.", constraints: [], assumptions: [] },
                { value: "premium", label: "Premium", shortDescription: "Full SASE with ZTNA and CASB.", description: "Complete FortiSASE stack with ZTNA, inline CASB, and DLP.", constraints: [], assumptions: [] },
              ],
            },
          ],
        },
      ],
    },
  });

  const dia = await prisma.service.create({
    data: {
      slug: "dedicated_internet",
      name: "Dedicated Internet Access",
      shortDescription: "Carrier-grade dedicated internet circuits.",
      description: "SLA-backed dedicated internet connectivity with guaranteed bandwidth, symmetric speeds, and carrier-grade uptime guarantees.",
      constraints: ["Pricing is location-dependent and subject to site survey.", "Lead time of 45-90 business days for new circuits."],
      assumptions: ["Fiber connectivity available at site.", "Demarc location accessible."],
      features: ["sla_backed", "symmetric_bandwidth"],
      serviceOptions: [
        {
          optionId: "carrier_dia",
          name: "Carrier DIA",
          shortDescription: "Standard dedicated internet from tier-1 carriers.",
          description: "Dedicated internet access circuit provisioned through tier-1 carrier partners with SLA-backed uptime and bandwidth guarantees.",
          constraints: ["Minimum 12-month contract term.", "Early termination fees apply."],
          assumptions: ["Carrier performs site survey prior to install.", "Standard business installation."],
          features: [],
          designOptions: [
            {
              groupId: "sla_tier",
              groupLabel: "SLA Tier",
              shortDescription: "Service level agreement commitment.",
              description: "Defines the uptime guarantee and response time SLA for the circuit.",
              constraints: [],
              assumptions: [],
              selectionType: "single",
              choices: [
                { value: "standard", label: "Standard SLA", shortDescription: "99.9% uptime guarantee.", description: "99.9% uptime SLA with 4-hour response time for outages.", constraints: [], assumptions: [] },
                { value: "premium", label: "Premium SLA", shortDescription: "99.99% uptime guarantee.", description: "99.99% uptime SLA with 2-hour response and proactive monitoring.", constraints: ["Premium pricing applies."], assumptions: ["Redundant carrier infrastructure at site."] },
              ],
            },
          ],
        },
      ],
    },
  });

  // 3. Create Packages
  await prisma.package.create({
    data: {
      slug: "cost_centric_01",
      name: "Cost Optimized Network",
      shortDescription: "Budget-friendly network design with essential connectivity.",
      description: "Budget-friendly network design prioritizing essential connectivity with managed SD-WAN and basic LAN. Ideal for cost-conscious deployments with standard security requirements.",
      constraints: ["Limited to standard security features.", "No dedicated internet circuits included."],
      assumptions: ["Standard internet circuits available at all sites.", "Basic security posture acceptable."],
      includedServices: [
        { serviceId: sdwan.id, serviceName: "Managed SD-WAN", inclusion: "required" },
        { serviceId: lan.id, serviceName: "Managed LAN", inclusion: "required" },
        { serviceId: wlan.id, serviceName: "Managed WLAN", inclusion: "optional" },
      ],
      collateral: [
        { title: "Cost Optimized Network Overview", url: "https://example.com/collateral/cost-optimized-overview.pdf", type: "PDF" },
        { title: "Reference Architecture Diagram", url: "https://example.com/collateral/cost-optimized-arch.pdf", type: "Diagram" },
      ],
    },
  });

  await prisma.package.create({
    data: {
      slug: "cloud_centric_01",
      name: "Cloud First Network",
      shortDescription: "Cloud-optimized architecture for SaaS-heavy organizations.",
      description: "Cloud-optimized architecture with full SD-WAN, managed WLAN, and dedicated internet for direct cloud access. Designed for organizations with heavy SaaS and IaaS workloads.",
      constraints: ["Requires local internet breakout for optimal cloud performance.", "DIA circuit lead times may delay deployment."],
      assumptions: ["Organization relies heavily on cloud/SaaS applications.", "Direct cloud connectivity reduces latency requirements."],
      includedServices: [
        { serviceId: sdwan.id, serviceName: "Managed SD-WAN", inclusion: "required" },
        { serviceId: lan.id, serviceName: "Managed LAN", inclusion: "required" },
        { serviceId: wlan.id, serviceName: "Managed WLAN", inclusion: "standard" },
        { serviceId: dia.id, serviceName: "Dedicated Internet Access", inclusion: "standard" },
      ],
      collateral: [
        { title: "Cloud First Network Overview", url: "https://example.com/collateral/cloud-first-overview.pdf", type: "PDF" },
        { title: "Cloud Connectivity Reference", url: "https://example.com/collateral/cloud-connectivity-ref.pdf", type: "Reference" },
        { title: "Cloud Architecture Diagram", url: "https://example.com/collateral/cloud-arch-diagram.pdf", type: "Diagram" },
      ],
    },
  });

  await prisma.package.create({
    data: {
      slug: "security_centric_01",
      name: "Security First SASE",
      shortDescription: "Zero-trust security architecture with full SASE stack.",
      description: "Zero-trust security architecture combining SD-WAN with full SASE stack. Includes NGFW, IPS, CASB, and ZTNA for comprehensive threat prevention across all sites.",
      constraints: ["Requires identity provider integration.", "Cloud inspection adds latency."],
      assumptions: ["Organization has compliance requirements driving security posture.", "Azure AD or Okta deployed as IdP."],
      includedServices: [
        { serviceId: sdwan.id, serviceName: "Managed SD-WAN", inclusion: "required" },
        { serviceId: security.id, serviceName: "Managed Security (SASE)", inclusion: "required" },
        { serviceId: lan.id, serviceName: "Managed LAN", inclusion: "standard" },
        { serviceId: wlan.id, serviceName: "Managed WLAN", inclusion: "standard" },
      ],
      collateral: [
        { title: "SASE Architecture Overview", url: "https://example.com/collateral/sase-overview.pdf", type: "PDF" },
        { title: "Zero Trust Reference Guide", url: "https://example.com/collateral/zero-trust-ref.pdf", type: "Reference" },
        { title: "SASE Network Diagram", url: "https://example.com/collateral/sase-network-diagram.pdf", type: "Diagram" },
      ],
    },
  });

  await prisma.package.create({
    data: {
      slug: "perf_sase_01",
      name: "Performance SASE",
      shortDescription: "High-throughput SASE for performance-sensitive enterprises.",
      description: "High-throughput SASE architecture with dedicated internet, full mesh SD-WAN, and premium security stack. Built for performance-sensitive enterprise environments requiring maximum bandwidth and minimal latency.",
      constraints: ["Highest cost tier.", "Full mesh limited to ~50 sites."],
      assumptions: ["Enterprise has performance-sensitive applications.", "Budget supports premium licensing."],
      includedServices: [
        { serviceId: sdwan.id, serviceName: "Managed SD-WAN", inclusion: "required" },
        { serviceId: security.id, serviceName: "Managed Security (SASE)", inclusion: "required" },
        { serviceId: lan.id, serviceName: "Managed LAN", inclusion: "required" },
        { serviceId: wlan.id, serviceName: "Managed WLAN", inclusion: "required" },
        { serviceId: dia.id, serviceName: "Dedicated Internet Access", inclusion: "standard" },
      ],
      collateral: [
        { title: "Performance SASE Overview", url: "https://example.com/collateral/perf-sase-overview.pdf", type: "PDF" },
        { title: "High-Throughput Architecture Diagram", url: "https://example.com/collateral/perf-sase-arch.pdf", type: "Diagram" },
        { title: "Enterprise Security Reference", url: "https://example.com/collateral/enterprise-security-ref.pdf", type: "Reference" },
        { title: "Performance Benchmarks", url: "https://example.com/collateral/perf-benchmarks.pdf", type: "PDF" },
      ],
    },
  });

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
