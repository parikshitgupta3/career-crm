"use client";

import { useCallback, useEffect, useState } from "react";
import { type Company } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";

type CompanyWithCount = Company & {
  _count?: {
    jobs: number;
  };
};

const COMPANIES_CACHE_TTL_MS = 60_000;

let companiesCache: CompanyWithCount[] | null = null;
let companiesCacheTimestamp = 0;

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T & { error?: string }) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? payload.error
        : `Request failed (${response.status})`;
    throw new Error(message || "Request failed");
  }

  return payload as T;
}

export default function CompanyManager() {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [careersUrl, setCareersUrl] = useState("");

  const loadCompanies = useCallback(async () => {
    try {
      setErrorMessage("");

      if (companiesCache && Date.now() - companiesCacheTimestamp < COMPANIES_CACHE_TTL_MS) {
        setCompanies(companiesCache);
        return;
      }

      const data = await requestJson<CompanyWithCount[]>("/api/companies");
      companiesCache = data;
      companiesCacheTimestamp = Date.now();
      setCompanies(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load companies");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCompanies();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCompanies]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setWebsite("");
    setCareersUrl("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setErrorMessage("");
      const payload = { name, website, careersUrl };

      if (editingId) {
        await requestJson("/api/companies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingId }),
        });
      } else {
        await requestJson("/api/companies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      companiesCache = null;
      resetForm();
      await loadCompanies();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save company");
    }
  };

  const handleEdit = (company: CompanyWithCount) => {
    setEditingId(company.id);
    setName(company.name);
    setWebsite(company.website || "");
    setCareersUrl(company.careersUrl || "");
  };

  const handleDelete = async (id: string) => {
    try {
      setErrorMessage("");
      await requestJson(`/api/companies?id=${id}`, { method: "DELETE" });
      companiesCache = null;
      await loadCompanies();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete company");
    }
  };

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="text-2xl font-semibold">Companies</h2>
        <p className="text-sm text-muted-foreground">Manage the companies tracked in your job pipeline.</p>
      </div>

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

      <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
        <Input
          placeholder="Company name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Input
          placeholder="Website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
        <Input
          placeholder="Careers URL"
          value={careersUrl}
          onChange={(event) => setCareersUrl(event.target.value)}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            size="icon"
            className="rounded-full"
            aria-label={editingId ? "Update company" : "Add company"}
            title={editingId ? "Update company" : "Add company"}
          >
            {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Careers URL</TableHead>
            <TableHead>Jobs</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>{company.name}</TableCell>
              <TableCell>{company.website || "-"}</TableCell>
              <TableCell>{company.careersUrl || "-"}</TableCell>
              <TableCell>{company._count?.jobs ?? 0}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-blue-500/15 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-300"
                  onClick={() => handleEdit(company)}
                  aria-label="Edit company"
                  title="Edit company"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-red-500/15 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                  onClick={() => void handleDelete(company.id)}
                  aria-label="Delete company"
                  title="Delete company"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {companies.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No companies yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
