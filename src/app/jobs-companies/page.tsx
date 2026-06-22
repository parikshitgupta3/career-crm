import CompanyManager from "@/components/CompanyManager";
import JobStatusBoard from "@/components/JobStatusBoard";

export default function JobsCompaniesPage() {
  return (
    <main className="space-y-6 p-4">
      <CompanyManager />
      <JobStatusBoard />
    </main>
  );
}
