import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const KNOWN_FIELDS = [
  "vendors",
  "purposes",
  "interfaceTypes",
  "wifiStandards",
  "cellularTypes",
  "poeStandards",
  "mountingOptions",
  "collateralTypes",
] as const;

type KnownField = (typeof KNOWN_FIELDS)[number];

export async function GET() {
  const taxonomy = await prisma.globalTaxonomy.findFirst({
    where: { slug: "global_taxonomy_v1" },
  });

  if (!taxonomy) {
    return NextResponse.json({ error: "Taxonomy not found" }, { status: 404 });
  }

  return NextResponse.json(taxonomy);
}

export async function PUT(req: Request) {
  try {
    const body: Record<string, string[]> = await req.json();

    // Split form fields into known columns and extra (user-created) fields
    const knownData: Record<KnownField, string[]> = {
      vendors: Array.isArray(body.vendors) ? body.vendors : [],
      purposes: Array.isArray(body.purposes) ? body.purposes : [],
      interfaceTypes: Array.isArray(body.interfaceTypes) ? body.interfaceTypes : [],
      wifiStandards: Array.isArray(body.wifiStandards) ? body.wifiStandards : [],
      cellularTypes: Array.isArray(body.cellularTypes) ? body.cellularTypes : [],
      poeStandards: Array.isArray(body.poeStandards) ? body.poeStandards : [],
      mountingOptions: Array.isArray(body.mountingOptions) ? body.mountingOptions : [],
      collateralTypes: Array.isArray(body.collateralTypes) ? body.collateralTypes : [],
    };

    // Everything else goes into extraFields
    const extraFields: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!(KNOWN_FIELDS as readonly string[]).includes(key) && Array.isArray(value)) {
        extraFields[key] = value;
      }
    }

    const taxonomy = await prisma.globalTaxonomy.upsert({
      where: { slug: "global_taxonomy_v1" },
      create: {
        slug: "global_taxonomy_v1",
        ...knownData,
        extraFields,
      },
      update: {
        ...knownData,
        extraFields,
      },
    });

    return NextResponse.json(taxonomy);
  } catch (error) {
    console.error("PUT /api/taxonomy error:", error);
    return NextResponse.json({ error: "Failed to save taxonomy" }, { status: 500 });
  }
}
