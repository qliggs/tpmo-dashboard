"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/gantt", label: "Gantt" },
  { href: "/capacity", label: "Capacity" },
  { href: "/engineers", label: "Engineers" },
  { href: "/risk", label: "Risk Register" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
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
      </div>
    </nav>
  );
}
