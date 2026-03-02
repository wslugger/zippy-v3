import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const taxonomy = await prisma.globalTaxonomy.findFirst({
    where: { slug: "global_taxonomy_v1" },
  });

  if (!taxonomy) {
    return NextResponse.json({ error: "Taxonomy not found" }, { status: 404 });
  }

  return NextResponse.json(taxonomy);
}
