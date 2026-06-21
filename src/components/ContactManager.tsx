"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import ContactForm from './ContactForm';
import { type Contact } from '@prisma/client';
import { Sun, Moon, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasInitializedTheme, setHasInitializedTheme] = useState(false);

  const fetchContacts = useCallback(async () => {
    const response = await fetch('/api/contacts');
    if (!response.ok) {
      setContacts([]);
      return;
    }
    const data = await response.json();
    setContacts(data);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/contacts');
        if (!response.ok) {
          setContacts([]);
          return;
        }
        const data = await response.json();
        setContacts(data);
      } catch (error) {
        console.error('Failed to load contacts', error);
        setContacts([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem('theme');
    if (stored) {
      setIsDarkMode(stored === 'dark');
      setHasInitializedTheme(true);
      return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    setHasInitializedTheme(true);
  }, []);

  useEffect(() => {
    if (!hasInitializedTheme) {
      return;
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, hasInitializedTheme]);

  const handleSave = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedContact) {
      // Update existing contact
      const response = await fetch(`/api/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactData, id: selectedContact.id }),
      });
      if (response.ok) {
        fetchContacts();
        setIsFormOpen(false);
        setSelectedContact(null);
      }
    } else {
      // Create new contact
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      if (response.ok) {
        fetchContacts();
        setIsFormOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/contacts?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchContacts();
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Career CRM</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => {
            setSelectedContact(null);
            setIsFormOpen(true);
          }}>Add Contact</Button>
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="flex items-center gap-3 rounded-full border border-border/70 bg-white/80 px-4 py-2 text-sm font-semibold text-foreground shadow-lg shadow-indigo-500/20 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-indigo-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <span className="flex items-center justify-center rounded-full bg-indigo-500/10 p-2 text-indigo-500 dark:bg-indigo-500/20">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {hasInitializedTheme ? (isDarkMode ? 'Dark' : 'Light') : 'Theme'}
              </span>
              <span>{hasInitializedTheme ? (isDarkMode ? 'Switch to Light' : 'Switch to Dark') : 'Loading'}</span>
            </span>
            <span className="flex items-center gap-1 text-indigo-500">
              <ArrowRight className="h-3 w-3" />
              <ArrowLeft className="h-3 w-3" />
            </span>
          </button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact.company}</TableCell>
              <TableCell>{contact.role}</TableCell>
              <TableCell>{contact.status}</TableCell>
              <TableCell>
                <Button variant="ghost" onClick={() => {
                  setSelectedContact(contact);
                  setIsFormOpen(true);
                }}>Edit</Button>
                <Button variant="ghost" onClick={() => handleDelete(contact.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isFormOpen && (
        <ContactForm
          key={selectedContact?.id || 'new'}
          contact={selectedContact}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedContact(null);
          }}
        />
      )}
    </div>
  );
}
