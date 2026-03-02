import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreatePackageSchema } from "@/lib/types";

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreatePackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, shortDescription, description, includedServices, collateral, isActive } =
      parsed.data;

    const existing = await prisma.package.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A package with this slug already exists" },
        { status: 409 }
      );
    }

    const pkg = await prisma.package.create({
      data: {
        name,
        slug,
        shortDescription,
        description,
        includedServices: includedServices as object[],
        collateral: collateral as object[],
        isActive,
      },
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
