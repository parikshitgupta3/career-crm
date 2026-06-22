"use client";

import { useCallback, useEffect, useState } from "react";
import { type Company, type Job, JobStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type JobWithCompany = Job & {
  company: Company;
};

const statusOptions = Object.values(JobStatus);
const JOBS_CACHE_TTL_MS = 60_000;

let jobsCache: JobWithCompany[] | null = null;
let jobsCacheTimestamp = 0;

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const payload = text
    ? (JSON.parse(text) as T & { error?: string; details?: string; requestId?: string })
    : null;

  if (!response.ok) {
    const baseMessage =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : `Request failed (${response.status})`;

    const details =
      payload && typeof payload === "object" && "details" in payload && typeof payload.details === "string"
        ? payload.details
        : "";

    const requestId =
      payload && typeof payload === "object" && "requestId" in payload && typeof payload.requestId === "string"
        ? payload.requestId
        : "";

    const message = [
      baseMessage,
      details ? `Details: ${details}` : "",
      requestId ? `Request ID: ${requestId}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    throw new Error(message || "Request failed");
  }

  return payload as T;
}

export default function JobStatusBoard() {
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      setErrorMessage("");

      if (jobsCache && Date.now() - jobsCacheTimestamp < JOBS_CACHE_TTL_MS) {
        setJobs(jobsCache);
        return;
      }

      const data = await requestJson<JobWithCompany[]>("/api/jobs");
      jobsCache = data;
      jobsCacheTimestamp = Date.now();
      setJobs(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load jobs");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadJobs();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadJobs]);

  const handleStatusChange = async (jobId: string, status: JobStatus) => {
    const currentJob = jobs.find((job) => job.id === jobId);
    if (!currentJob) {
      return;
    }

    setUpdatingId(jobId);
    setErrorMessage("");

    try {
      const updated = await requestJson<JobWithCompany>("/api/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status }),
      });

      setJobs((prev) => {
        const next = prev.map((job) => (job.id === jobId ? updated : job));
        jobsCache = next;
        jobsCacheTimestamp = Date.now();
        return next;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update job status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="text-2xl font-semibold">Job Pipeline</h2>
        <p className="text-sm text-muted-foreground">Jobs are sourced by backend pipeline. Update status here.</p>
      </div>

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Posted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>{job.title}</TableCell>
              <TableCell>{job.company.name}</TableCell>
              <TableCell>{job.location || "-"}</TableCell>
              <TableCell>
                <select
                  className={`h-9 rounded-md border px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-900 text-slate-100"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                  style={{ colorScheme: isDarkMode ? "dark" : "light" }}
                  value={job.status}
                  onChange={(event) => void handleStatusChange(job.id, event.target.value as JobStatus)}
                  disabled={updatingId === job.id}
                >
                  {statusOptions.map((status) => (
                    <option
                      key={status}
                      value={status}
                      className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </TableCell>
              <TableCell>{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : "-"}</TableCell>
            </TableRow>
          ))}
          {jobs.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No jobs yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
