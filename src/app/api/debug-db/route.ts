import { NextResponse } from "next/server";
import { neonConfig } from "@neondatabase/serverless";

export async function GET() {
  const steps: { step: string; status: "ok" | "fail"; detail: string }[] = [];

  // Step 1: Read env var
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    steps.push({ step: "read DATABASE_URL", status: "fail", detail: "not set" });
    return NextResponse.json({ steps }, { status: 500 });
  }
  steps.push({ step: "read DATABASE_URL", status: "ok", detail: `length=${rawUrl.length}` });

  // Step 2: Parse URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    steps.push({
      step: "parse DATABASE_URL",
      status: "ok",
      detail: `protocol=${parsed.protocol} host=${parsed.hostname} port=${parsed.port || "default"} db=${parsed.pathname} params=${parsed.search}`,
    });
  } catch (err) {
    steps.push({
      step: "parse DATABASE_URL",
      status: "fail",
      detail: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ steps }, { status: 500 });
  }

  // Step 3: Protocol check
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    steps.push({
      step: "protocol check",
      status: "fail",
      detail: `unexpected protocol: ${parsed.protocol}`,
    });
    return NextResponse.json({ steps }, { status: 500 });
  }
  steps.push({ step: "protocol check", status: "ok", detail: parsed.protocol });

  // Step 4: Host check
  if (!parsed.hostname || parsed.hostname === "api.db" || parsed.hostname === "localhost") {
    steps.push({
      step: "host check",
      status: "fail",
      detail: `invalid or placeholder host: "${parsed.hostname}"`,
    });
    return NextResponse.json({ steps }, { status: 500 });
  }
  steps.push({ step: "host check", status: "ok", detail: parsed.hostname });

  // Step 5: DNS resolution via fetch (Neon HTTP)
  neonConfig.poolQueryViaFetch = true;
  const { neon } = await import("@neondatabase/serverless");

  try {
    const sql = neon(rawUrl);
    const result = await sql`SELECT 1 AS ping`;
    steps.push({
      step: "execute SELECT 1",
      status: "ok",
      detail: `rows=${JSON.stringify(result)}`,
    });
  } catch (err) {
    const cause =
      err instanceof Error && err.cause instanceof Error
        ? `cause: ${err.cause.message} (${(err.cause as NodeJS.ErrnoException).code ?? ""})`
        : "";
    steps.push({
      step: "execute SELECT 1",
      status: "fail",
      detail: `${err instanceof Error ? err.message : String(err)} ${cause}`.trim(),
    });
    return NextResponse.json({ steps }, { status: 500 });
  }

  // Step 6: Prisma query
  try {
    const { prisma } = await import("@/lib/prisma");
    const count = await prisma.job.count();
    steps.push({ step: "prisma job.count()", status: "ok", detail: `count=${count}` });
  } catch (err) {
    steps.push({
      step: "prisma job.count()",
      status: "fail",
      detail: err instanceof Error ? `${err.message} | cause: ${String(err.cause)}` : String(err),
    });
    return NextResponse.json({ steps }, { status: 500 });
  }

  return NextResponse.json({ steps });
}
