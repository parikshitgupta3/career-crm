"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/companies", label: "Companies" },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/40 dark:shadow-black/50"
                  : "bg-transparent text-foreground/80 hover:bg-accent/80 hover:text-foreground hover:shadow-md dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:hover:shadow-black/40"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
