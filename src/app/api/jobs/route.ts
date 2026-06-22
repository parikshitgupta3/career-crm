import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { JobStatus } from "@prisma/client";

const statuses = new Set(Object.values(JobStatus));

type RequestLogMeta = {
  requestId: string;
  method: string;
  path: string;
  query: Record<string, string>;
  startedAt: number;
};

function createRequestLogMeta(request: Request, method: string): RequestLogMeta {
  const url = new URL(request.url);

  return {
    requestId: crypto.randomUUID(),
    method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    startedAt: Date.now(),
  };
}

function logRequestStart(meta: RequestLogMeta) {
  console.info("[jobs-api] request:start", {
    requestId: meta.requestId,
    method: meta.method,
    path: meta.path,
    query: meta.query,
  });
}

function logRequestSuccess(meta: RequestLogMeta, extra?: Record<string, unknown>) {
  console.info("[jobs-api] request:success", {
    requestId: meta.requestId,
    method: meta.method,
    path: meta.path,
    durationMs: Date.now() - meta.startedAt,
    ...extra,
  });
}

function getErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function logRequestError(meta: RequestLogMeta, error: unknown, extra?: Record<string, unknown>) {
  const normalizedError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
        }
      : {
          value: error,
        };

  const prismaDetails =
    typeof error === "object" && error !== null
      ? {
          code: Reflect.get(error, "code"),
          meta: Reflect.get(error, "meta"),
          clientVersion: Reflect.get(error, "clientVersion"),
        }
      : undefined;

  console.error("[jobs-api] request:error", {
    requestId: meta.requestId,
    method: meta.method,
    path: meta.path,
    durationMs: Date.now() - meta.startedAt,
    query: meta.query,
    ...extra,
    error: normalizedError,
    prisma: prismaDetails,
  });
}

function jsonErrorResponse(meta: RequestLogMeta, status: number, error: string, details: string) {
  return NextResponse.json(
    {
      error,
      details,
      requestId: meta.requestId,
    },
    { status },
  );
}

function parseIntOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function GET(request: Request) {
  const meta = createRequestLogMeta(request, "GET");
  logRequestStart(meta);

  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        company: true,
      },
    });

    logRequestSuccess(meta, { jobsCount: jobs.length });

    return NextResponse.json(jobs);
  } catch (error) {
    logRequestError(meta, error);

    return jsonErrorResponse(meta, 500, "Failed to load jobs", getErrorDetails(error));
  }
}

export async function POST(request: Request) {
  const meta = createRequestLogMeta(request, "POST");
  logRequestStart(meta);

  try {
    const body = await request.json();
    console.info("[jobs-api] request:body", {
      requestId: meta.requestId,
      companyId: body?.companyId,
      status: body?.status,
      hasTitle: Boolean(body?.title),
      hasSourceUrl: Boolean(body?.sourceUrl),
    });

    if (!body.companyId) {
      logRequestSuccess(meta, { statusCode: 400, reason: "Company is required" });
      return jsonErrorResponse(meta, 400, "Company is required", "Validation error");
    }

    if (!body.title?.trim()) {
      logRequestSuccess(meta, { statusCode: 400, reason: "Job title is required" });
      return jsonErrorResponse(meta, 400, "Job title is required", "Validation error");
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

    logRequestSuccess(meta, {
      jobId: job.id,
      companyId: job.companyId,
      statusCode: 200,
    });

    return NextResponse.json(job);
  } catch (error) {
    logRequestError(meta, error);

    return jsonErrorResponse(meta, 500, "Failed to create job", getErrorDetails(error));
  }
}

export async function PUT(request: Request) {
  const meta = createRequestLogMeta(request, "PUT");
  logRequestStart(meta);

  try {
    const body = await request.json();
    const { id, ...data } = body;

    console.info("[jobs-api] request:body", {
      requestId: meta.requestId,
      id,
      updateFields: Object.keys(data),
      status: data?.status,
    });

    if (!id) {
      logRequestSuccess(meta, { statusCode: 400, reason: "Job id is required" });
      return jsonErrorResponse(meta, 400, "Job id is required", "Validation error");
    }

    if (data.status && !statuses.has(data.status as JobStatus)) {
      logRequestSuccess(meta, { statusCode: 400, reason: "Invalid status" });
      return jsonErrorResponse(meta, 400, "Invalid status", "Validation error");
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

    logRequestSuccess(meta, {
      jobId: job.id,
      statusCode: 200,
      updatedStatus: job.status,
    });

    return NextResponse.json(job);
  } catch (error) {
    logRequestError(meta, error);

    return jsonErrorResponse(meta, 500, "Failed to update job", getErrorDetails(error));
  }
}

export async function DELETE(request: Request) {
  const meta = createRequestLogMeta(request, "DELETE");
  logRequestStart(meta);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      logRequestSuccess(meta, { statusCode: 400, reason: "Job id is required" });
      return jsonErrorResponse(meta, 400, "Job id is required", "Validation error");
    }

    await prisma.job.delete({
      where: { id },
    });

    logRequestSuccess(meta, { jobId: id, statusCode: 200 });

    return NextResponse.json({ success: true });
  } catch (error) {
    logRequestError(meta, error);

    return jsonErrorResponse(meta, 500, "Failed to delete job", getErrorDetails(error));
  }
}
