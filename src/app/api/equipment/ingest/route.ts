import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractText } from "@/lib/doc-extract";
import { callGemini } from "@/lib/gemini";

// Default prompt used when no DB entry exists for this slug
const DEFAULT_SYSTEM = `You are an expert network equipment analyst. Your job is to read vendor datasheets and extract structured equipment catalog data.

RULES:
- Only extract facts explicitly stated in the datasheet. Do NOT guess or fabricate values.
- If a value cannot be determined from the document, set it to null.
- Numbers must be plain numbers (no commas, no units in the value).
- "roles" must be one or more of: "WAN", "LAN", "WLAN".
- For "service" and "serviceOption", infer the best match from the AVAILABLE_SERVICES list provided.
- Return valid JSON only — no markdown fences, no commentary.`;

const DEFAULT_TEMPLATE = `Analyze the following equipment datasheet(s) and extract structured data for EACH distinct equipment model found.

AVAILABLE SERVICES (use these for service/serviceOption mapping):
{serviceSummaries}

For EACH model found, return a JSON object with these fields:

{
  "items": [
    {
      "model": "string — exact model name/number",
      "description": "string — short product description",
      "family": "string — product family or series name",
      "roles": ["WAN" | "LAN" | "WLAN"],
      "service": "string — best matching service name from AVAILABLE_SERVICES, or null",
      "serviceOption": "string — best matching service option name from AVAILABLE_SERVICES, or null",
      "status": "Available",
      "vendorId": "string — vendor SKU if found, or null",
      "pricing": {
        "purchasePrice": 0,
        "rentalPrice": 0,
        "managementSize": "Small"
      },
      "specs": {
        "rawFirewallThroughputMbps": "number or null (WAN only) — Use the highest 'Forwarding (512B)' or 'Stateful Firewall' throughput from performance tables. Convert Gbps to Mbps (e.g. 1.9 Gbps = 1900).",
        "sdwanCryptoThroughputMbps": "number or null (WAN only) — Use 'IPsec (512B)', 'VPN throughput', 'IPsec IMIX', or 'SD-WAN Routing' values. Convert Gbps to Mbps.",
        "advancedSecurityThroughputMbps": "number or null (WAN only) — Use 'SD-WAN*', 'Threat protection', 'IDS/IPS', 'UTM', or 'Advanced Security' throughput values. Convert Gbps to Mbps.",
        "cellularType": "string or null (WAN only) — Detect cellular WAN capability. Use '5G Sub-6', '5G mmWave', 'LTE Cat 18', 'LTE Cat 12', 'LTE Cat 6', 'LTE Cat 4', or null if no cellular.",
        "cellularIntegration": "string or null (WAN only) — How cellular is provided. Use 'Integrated' (built-in modem), 'PIM Module' (pluggable interface module like Cisco PIM/NIM), 'USB Dongle', 'External Gateway', or null if no cellular.",
        "wanPortCount": "number or null (WAN only)",
        "wanPortType": "string or null (WAN only)",
        "lanPortCount": "number or null (WAN/LAN only)",
        "lanPortType": "string or null (WAN/LAN only)",
        "accessPortCount": "number or null (LAN only)",
        "accessPortType": "string or null (LAN only)",
        "uplinkPortCount": "number or null (LAN only)",
        "uplinkPortType": "string or null (LAN only)",
        "poeBudgetWatts": "number or null (LAN only)",
        "isStackable": "boolean (LAN only, default false)",
        "wifiStandard": "string or null (WLAN only)",
        "mimoBandwidth": "string or null (WLAN only)",
        "powerDrawWatts": "number or null (WLAN only)",
        "environment": "string or null (WLAN only — 'Indoor' or 'Outdoor')",
        "uplinkType": "string or null (WLAN only)",
        "mimoDensity": "string or null (WLAN only, e.g. '2x2:2', '4x4:4')",
        "mountingOptions": ["array of strings or null (WLAN only)"]
      },
      "confidence": "number 0-100 — your overall confidence in the extraction"
    }
  ]
}

Only include spec fields relevant to the detected role(s). Omit non-applicable spec fields entirely (don't set them to null).

DATASHEET CONTENT:
{datasheetText}`;

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") ?? "";

        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Expected multipart/form-data with file uploads" },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const ingestUrl = formData.get("url") as string | null;

        if (files.length === 0 && !ingestUrl) {
            return NextResponse.json(
                { error: "No files uploaded or URL provided" },
                { status: 400 }
            );
        }

        // Extract text from all uploaded files
        let datasheetText = "";
        let successfulExtractions = 0;

        for (const file of files) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const text = await extractText(buffer, file.type, file.name);

                if (text.trim()) {
                    successfulExtractions++;
                    datasheetText += `\n[Document: ${file.name}]\n${text}\n`;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (extractErr: any) {
                console.error(`Error extracting text from ${file.name}:`, extractErr.message);
            }
        }

        // Extract text from URL if provided
        if (ingestUrl) {
            try {
                // Validate URL scheme to prevent SSRF
                const parsedUrl = new URL(ingestUrl);
                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    return NextResponse.json({ error: "Only http and https URLs are supported" }, { status: 400 });
                }

                const response = await fetch(ingestUrl);
                if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

                const contentType = response.headers.get("content-type") || "";
                let text = "";

                if (contentType.includes("application/pdf")) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    text = await extractText(buffer, "application/pdf", ingestUrl);
                } else {
                    // Basic HTML/Plaintext handling
                    text = await response.text();
                    // Strip some HTML if it looks like HTML
                    if (text.includes("<body") || text.includes("<html")) {
                        text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
                            .replace(/<[^>]+>/g, " ")
                            .replace(/\s+/g, " ");
                    }
                }

                if (text.trim()) {
                    successfulExtractions++;
                    datasheetText += `\n[Source URL: ${ingestUrl}]\n${text}\n`;
                }
            } catch (urlErr: any) {
                console.error(`Error ingesting from URL ${ingestUrl}:`, urlErr.message);
                if (successfulExtractions === 0 && files.length === 0) {
                    return NextResponse.json({ error: `Could not fetch or read content from the provided URL: ${urlErr.message}` }, { status: 400 });
                }
            }
        }

        if (successfulExtractions === 0) {
            return NextResponse.json(
                {
                    error: "Could not extract readable text from provided source(s).",
                },
                { status: 400 }
            );
        }

        // Load services for matching
        const services = await prisma.service.findMany({
            where: { isActive: true },
            select: { name: true, serviceOptions: true },
        });

        const serviceSummaries = services
            .map((s) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const options = (s.serviceOptions as any[]).map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (o: any) => `  - Option: "${o.name}" (${o.shortDescription || ""})`
                );
                return `Service: "${s.name}"\n${options.join("\n")}`;
            })
            .join("\n\n");

        // Load prompt config from DB, or use defaults
        const promptConfig = await prisma.aIPrompt.findUnique({
            where: { slug: "equipment_datasheet_ingest" },
        });

        const model = promptConfig?.model ?? "gemini-3.1-pro-preview";
        const temperature = promptConfig?.temperature ?? 0.1;
        const systemInstruction =
            promptConfig?.systemInstruction ?? DEFAULT_SYSTEM;
        const userPromptTemplate =
            promptConfig?.userPromptTemplate ?? DEFAULT_TEMPLATE;

        const DEFAULT_SYSTEM_URL_AWARE = `${systemInstruction}\n- Set "datasheetUrl" to the provided [Source URL] if only one URL was provided, or if the model can be clearly attributed to that source.`;

        const userPrompt = userPromptTemplate
            .replace("{serviceSummaries}", serviceSummaries)
            .replace("{datasheetText}", datasheetText.trim());

        // Call Gemini
        const rawResponse = await callGemini({
            model,
            temperature,
            systemInstruction: ingestUrl ? DEFAULT_SYSTEM_URL_AWARE : systemInstruction,
            userPrompt,
            responseMimeType: "application/json",
        });

        // Parse JSON from Gemini response
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("Gemini raw response:", rawResponse);
            return NextResponse.json(
                { error: "AI returned an unexpected format. Please try again." },
                { status: 502 }
            );
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            console.error("Gemini returned invalid JSON:", jsonMatch[0]);
            return NextResponse.json(
                { error: "AI returned an unexpected format. Please try again." },
                { status: 502 }
            );
        }

        // Normalize: ensure we always return an items array
        let items = Array.isArray(parsed.items)
            ? parsed.items
            : Array.isArray(parsed)
                ? parsed
                : [parsed];

        // Post-process to ensure datasheetUrl is present if a URL was provided
        if (ingestUrl) {
            items = items.map((item: any) => ({
                ...item,
                datasheetUrl: item.datasheetUrl || ingestUrl
            }));
        }

        return NextResponse.json({ items });
    } catch (err) {
        console.error("POST /api/equipment/ingest error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
