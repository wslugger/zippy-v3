import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UpdatePackageSchema } from "@/lib/types";

type Params = { params: Promise<{ packageId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { packageId } = await params;

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }
  return NextResponse.json(pkg);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { packageId } = await params;
    const body = await request.json();
    const parsed = UpdatePackageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { includedServices, collateral, ...rest } = parsed.data;

    const updated = await prisma.package.update({
      where: { id: packageId },
      data: {
        ...rest,
        ...(includedServices !== undefined && {
          includedServices: includedServices as object[],
        }),
        ...(collateral !== undefined && {
          collateral: collateral as object[],
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { packageId } = await params;
    await prisma.package.delete({ where: { id: packageId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
