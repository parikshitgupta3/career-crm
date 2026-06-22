import ContactManager from '@/components/ContactManager';
import JobStatusBoard from '@/components/JobStatusBoard';

export default function HomePage() {
  return (
    <main className="space-y-6 p-4">
      <ContactManager />
      <JobStatusBoard />
    </main>
  );
}

