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
import { Plus, Pencil, Trash2 } from 'lucide-react';

const CONTACTS_CACHE_TTL_MS = 60_000;
const CONTACTS_CACHE_KEY = 'contacts_cache';
const CONTACTS_CACHE_TS_KEY = 'contacts_cache_ts';

function clearContactsCache() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(CONTACTS_CACHE_KEY);
  window.sessionStorage.removeItem(CONTACTS_CACHE_TS_KEY);
}

export default function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async () => {
    if (typeof window !== 'undefined') {
      const cachedJson = window.sessionStorage.getItem(CONTACTS_CACHE_KEY);
      const cachedTs = window.sessionStorage.getItem(CONTACTS_CACHE_TS_KEY);

      if (cachedJson && cachedTs) {
        const timestamp = Number(cachedTs);
        if (!Number.isNaN(timestamp) && Date.now() - timestamp < CONTACTS_CACHE_TTL_MS) {
          setContacts(JSON.parse(cachedJson) as Contact[]);
          return;
        }
      }
    }

    const response = await fetch('/api/contacts');
    if (!response.ok) {
      setContacts([]);
      return;
    }

    const data = (await response.json()) as Contact[];
    setContacts(data);

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(data));
      window.sessionStorage.setItem(CONTACTS_CACHE_TS_KEY, String(Date.now()));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchContacts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchContacts]);

  const handleSave = async (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedContact) {
      // Update existing contact
      const response = await fetch(`/api/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactData, id: selectedContact.id }),
      });
      if (response.ok) {
        clearContactsCache();
        await fetchContacts();
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
        clearContactsCache();
        await fetchContacts();
        setIsFormOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/contacts?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      clearContactsCache();
      await fetchContacts();
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Career CRM</h1>
        <Button
          size="icon"
          onClick={() => {
            setSelectedContact(null);
            setIsFormOpen(true);
          }}
          className="rounded-full"
          aria-label="Add contact"
          title="Add contact"
        >
          <Plus className="h-4 w-4" />
        </Button>
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-blue-500/15 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-300"
                  onClick={() => {
                    setSelectedContact(contact);
                    setIsFormOpen(true);
                  }}
                  aria-label="Edit contact"
                  title="Edit contact"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-red-500/15 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-300"
                  onClick={() => handleDelete(contact.id)}
                  aria-label="Delete contact"
                  title="Delete contact"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
