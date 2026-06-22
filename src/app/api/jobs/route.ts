import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { JobStatus } from "@prisma/client";

const statuses = new Set(Object.values(JobStatus));

function parseIntOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: true,
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load jobs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.companyId) {
      return NextResponse.json({ error: "Company is required" }, { status: 400 });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    const status = statuses.has(body.status as JobStatus) ? body.status : JobStatus.NEW;

    const job = await prisma.job.create({
      data: {
        companyId: body.companyId,
        title: body.title.trim(),
        location: body.location?.trim() || null,
        description: body.description?.trim() || null,
        rawDescription: body.rawDescription?.trim() || null,
        sourceUrl: body.sourceUrl?.trim() || null,
        salaryMin: parseIntOrNull(body.salaryMin),
        salaryMax: parseIntOrNull(body.salaryMax),
        currency: body.currency?.trim() || null,
        experienceMin: parseIntOrNull(body.experienceMin),
        experienceMax: parseIntOrNull(body.experienceMax),
        skills: body.skills?.trim() || null,
        status,
        postedAt: body.postedAt ? new Date(body.postedAt) : null,
      },
      include: {
        company: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create job",
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
      return NextResponse.json({ error: "Job id is required" }, { status: 400 });
    }

    if (data.status && !statuses.has(data.status as JobStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (data.companyId !== undefined) {
      updateData.companyId = data.companyId;
    }

    if (data.title !== undefined) {
      if (!String(data.title).trim()) {
        return NextResponse.json({ error: "Job title cannot be empty" }, { status: 400 });
      }
      updateData.title = String(data.title).trim();
    }

    if (data.location !== undefined) {
      updateData.location = data.location ? String(data.location).trim() : null;
    }

    if (data.description !== undefined) {
      updateData.description = data.description ? String(data.description).trim() : null;
    }

    if (data.rawDescription !== undefined) {
      updateData.rawDescription = data.rawDescription ? String(data.rawDescription).trim() : null;
    }

    if (data.sourceUrl !== undefined) {
      updateData.sourceUrl = data.sourceUrl ? String(data.sourceUrl).trim() : null;
    }

    if (data.salaryMin !== undefined) {
      updateData.salaryMin = parseIntOrNull(data.salaryMin);
    }

    if (data.salaryMax !== undefined) {
      updateData.salaryMax = parseIntOrNull(data.salaryMax);
    }

    if (data.currency !== undefined) {
      updateData.currency = data.currency ? String(data.currency).trim() : null;
    }

    if (data.experienceMin !== undefined) {
      updateData.experienceMin = parseIntOrNull(data.experienceMin);
    }

    if (data.experienceMax !== undefined) {
      updateData.experienceMax = parseIntOrNull(data.experienceMax);
    }

    if (data.skills !== undefined) {
      updateData.skills = data.skills ? String(data.skills).trim() : null;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.postedAt !== undefined) {
      updateData.postedAt = data.postedAt ? new Date(data.postedAt as string) : null;
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update job",
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
      return NextResponse.json({ error: "Job id is required" }, { status: 400 });
    }

    await prisma.job.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
