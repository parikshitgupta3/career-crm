import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load companies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name: body.name.trim(),
        website: body.website?.trim() || null,
        careersUrl: body.careersUrl?.trim() || null,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Company id is required" }, { status: 400 });
    }

    if (!data.name?.trim()) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: data.name.trim(),
        website: data.website?.trim() || null,
        careersUrl: data.careersUrl?.trim() || null,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Company id is required" }, { status: 400 });
    }

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete company. Delete related jobs first.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
