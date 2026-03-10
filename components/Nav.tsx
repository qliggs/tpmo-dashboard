"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSettings } from "@/lib/settingsContext";
import SettingsPanel from "./SettingsPanel";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/gantt", label: "Gantt" },
  { href: "/capacity", label: "Capacity" },
  { href: "/engineers", label: "Engineers" },
  { href: "/risk", label: "Risk Register" },
];

export default function Nav() {
  const pathname = usePathname();
  const { isModified } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 flex items-center gap-8 h-12">
          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-sm font-bold tracking-widest text-blue-500 uppercase">
              TPMO
            </span>
            <span className="text-sm text-slate-600 font-medium hidden sm:block">
              Portfolio Intelligence
            </span>
          </div>

          <div className="flex items-stretch h-12">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 flex items-center text-sm font-medium tracking-wide transition-colors border-b-2 ${
                    active
                      ? "border-blue-500 text-slate-100"
                      : "border-transparent text-slate-500 hover:text-slate-200 hover:border-slate-600"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Gear icon — right side */}
          <div className="ml-auto flex items-center">
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              className="relative p-1.5 rounded transition-colors hover:bg-slate-800/60"
              title="Dashboard settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 transition-colors ${
                  isModified
                    ? "text-blue-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <path
                  fillRule="evenodd"
                  d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.992 6.992 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              {/* Blue dot indicator when settings are non-default */}
              {isModified && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
