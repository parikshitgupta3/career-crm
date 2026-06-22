"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { type Company, type Job, JobStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type CompanyWithCount = Company & {
  _count?: {
    jobs: number;
  };
};

type JobWithCompany = Job & {
  company: Company;
};

const statusOptions = Object.values(JobStatus);

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T & { error?: string }) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? payload.error
        : `Request failed (${response.status})`;
    throw new Error(message || 'Request failed');
  }

  return payload as T;
}

export default function JobPipelineManager() {
  const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
  const [jobs, setJobs] = useState<JobWithCompany[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyCareersUrl, setCompanyCareersUrl] = useState('');

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobCompanyId, setJobCompanyId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobStatus, setJobStatus] = useState<JobStatus>(JobStatus.NEW);
  const [jobSourceUrl, setJobSourceUrl] = useState('');
  const [jobSalaryMin, setJobSalaryMin] = useState('');
  const [jobSalaryMax, setJobSalaryMax] = useState('');
  const [jobCurrency, setJobCurrency] = useState('');
  const [jobExperienceMin, setJobExperienceMin] = useState('');
  const [jobExperienceMax, setJobExperienceMax] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [jobPostedAt, setJobPostedAt] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobRawDescription, setJobRawDescription] = useState('');

  const loadCompanies = useCallback(async () => {
    const data = await requestJson<CompanyWithCount[]>('/api/companies');
    setCompanies(data);

    if (data.length > 0 && !jobCompanyId) {
      setJobCompanyId(data[0].id);
    }
  }, [jobCompanyId]);

  const loadJobs = useCallback(async () => {
    const data = await requestJson<JobWithCompany[]>('/api/jobs');
    setJobs(data);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setErrorMessage('');
      await Promise.all([loadCompanies(), loadJobs()]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load data');
    }
  }, [loadCompanies, loadJobs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadAll]);

  const resetCompanyForm = () => {
    setEditingCompanyId(null);
    setCompanyName('');
    setCompanyWebsite('');
    setCompanyCareersUrl('');
  };

  const resetJobForm = () => {
    setEditingJobId(null);
    setJobTitle('');
    setJobLocation('');
    setJobStatus(JobStatus.NEW);
    setJobSourceUrl('');
    setJobSalaryMin('');
    setJobSalaryMax('');
    setJobCurrency('');
    setJobExperienceMin('');
    setJobExperienceMax('');
    setJobSkills('');
    setJobPostedAt('');
    setJobDescription('');
    setJobRawDescription('');
  };

  const handleCompanySubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setErrorMessage('');
      const payload = {
        name: companyName,
        website: companyWebsite,
        careersUrl: companyCareersUrl,
      };

      if (editingCompanyId) {
        await requestJson('/api/companies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingCompanyId }),
        });
      } else {
        await requestJson('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      resetCompanyForm();
      await loadAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save company');
    }
  };

  const handleCompanyEdit = (company: CompanyWithCount) => {
    setEditingCompanyId(company.id);
    setCompanyName(company.name);
    setCompanyWebsite(company.website || '');
    setCompanyCareersUrl(company.careersUrl || '');
  };

  const handleCompanyDelete = async (id: string) => {
    try {
      setErrorMessage('');
      await requestJson(`/api/companies?id=${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete company');
    }
  };

  const handleJobSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setErrorMessage('');
      const payload = {
        companyId: jobCompanyId,
        title: jobTitle,
        location: jobLocation,
        status: jobStatus,
        sourceUrl: jobSourceUrl,
        salaryMin: jobSalaryMin,
        salaryMax: jobSalaryMax,
        currency: jobCurrency,
        experienceMin: jobExperienceMin,
        experienceMax: jobExperienceMax,
        skills: jobSkills,
        postedAt: jobPostedAt ? new Date(jobPostedAt).toISOString() : null,
        description: jobDescription,
        rawDescription: jobRawDescription,
      };

      if (editingJobId) {
        await requestJson('/api/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingJobId }),
        });
      } else {
        await requestJson('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      resetJobForm();
      await loadAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save job');
    }
  };

  const handleJobEdit = (job: JobWithCompany) => {
    setEditingJobId(job.id);
    setJobCompanyId(job.companyId);
    setJobTitle(job.title);
    setJobLocation(job.location || '');
    setJobStatus(job.status);
    setJobSourceUrl(job.sourceUrl || '');
    setJobSalaryMin(job.salaryMin?.toString() || '');
    setJobSalaryMax(job.salaryMax?.toString() || '');
    setJobCurrency(job.currency || '');
    setJobExperienceMin(job.experienceMin?.toString() || '');
    setJobExperienceMax(job.experienceMax?.toString() || '');
    setJobSkills(job.skills || '');
    setJobPostedAt(job.postedAt ? new Date(job.postedAt).toISOString().slice(0, 10) : '');
    setJobDescription(job.description || '');
    setJobRawDescription(job.rawDescription || '');
  };

  const handleJobDelete = async (id: string) => {
    try {
      setErrorMessage('');
      await requestJson(`/api/jobs?id=${id}`, { method: 'DELETE' });
      await loadAll();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete job');
    }
  };

  const canSaveJob = useMemo(() => companies.length > 0, [companies.length]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Job Pipeline Manager</h1>
        <p className="text-muted-foreground">Manage companies and jobs for your sourcing pipeline.</p>
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </header>

      <section className="space-y-4 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Companies</h2>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={handleCompanySubmit}>
          <Input
            placeholder="Company name"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            required
          />
          <Input
            placeholder="Website"
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
          />
          <Input
            placeholder="Careers URL"
            value={companyCareersUrl}
            onChange={(event) => setCompanyCareersUrl(event.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit">{editingCompanyId ? 'Update' : 'Add'} Company</Button>
            {editingCompanyId && (
              <Button type="button" variant="ghost" onClick={resetCompanyForm}>
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
                <TableCell>{company.website || '-'}</TableCell>
                <TableCell>{company.careersUrl || '-'}</TableCell>
                <TableCell>{company._count?.jobs ?? 0}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" onClick={() => handleCompanyEdit(company)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => void handleCompanyDelete(company.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-4 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Jobs</h2>

        <form className="grid gap-3 md:grid-cols-3" onSubmit={handleJobSubmit}>
          <select
            className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={jobCompanyId}
            onChange={(event) => setJobCompanyId(event.target.value)}
            required
            disabled={!canSaveJob}
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <Input
            placeholder="Job title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            required
          />

          <select
            className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={jobStatus}
            onChange={(event) => setJobStatus(event.target.value as JobStatus)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <Input
            placeholder="Location"
            value={jobLocation}
            onChange={(event) => setJobLocation(event.target.value)}
          />
          <Input
            placeholder="Source URL"
            value={jobSourceUrl}
            onChange={(event) => setJobSourceUrl(event.target.value)}
          />
          <Input
            placeholder="Posted date (YYYY-MM-DD)"
            type="date"
            value={jobPostedAt}
            onChange={(event) => setJobPostedAt(event.target.value)}
          />

          <Input
            placeholder="Salary min"
            value={jobSalaryMin}
            onChange={(event) => setJobSalaryMin(event.target.value)}
          />
          <Input
            placeholder="Salary max"
            value={jobSalaryMax}
            onChange={(event) => setJobSalaryMax(event.target.value)}
          />
          <Input
            placeholder="Currency"
            value={jobCurrency}
            onChange={(event) => setJobCurrency(event.target.value)}
          />

          <Input
            placeholder="Experience min"
            value={jobExperienceMin}
            onChange={(event) => setJobExperienceMin(event.target.value)}
          />
          <Input
            placeholder="Experience max"
            value={jobExperienceMax}
            onChange={(event) => setJobExperienceMax(event.target.value)}
          />
          <Input
            placeholder="Skills (comma separated)"
            value={jobSkills}
            onChange={(event) => setJobSkills(event.target.value)}
          />

          <Textarea
            className="md:col-span-3"
            placeholder="Description"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
          <Textarea
            className="md:col-span-3"
            placeholder="Raw description"
            value={jobRawDescription}
            onChange={(event) => setJobRawDescription(event.target.value)}
          />

          <div className="flex gap-2 md:col-span-3">
            <Button type="submit" disabled={!canSaveJob}>
              {editingJobId ? 'Update' : 'Add'} Job
            </Button>
            {editingJobId && (
              <Button type="button" variant="ghost" onClick={resetJobForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.company.name}</TableCell>
                <TableCell>{job.status}</TableCell>
                <TableCell>{job.location || '-'}</TableCell>
                <TableCell>{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="ghost" onClick={() => handleJobEdit(job)}>
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => void handleJobDelete(job.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
