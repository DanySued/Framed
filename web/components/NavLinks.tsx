"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const pathname = usePathname();
  const links = [
    { href: "/studio", label: "Studio" },
    { href: "/films", label: "Films" },
  ];
  return (
    <nav className="flex items-center gap-6">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="text-[0.8125rem] font-medium transition-colors"
            style={{ color: active ? "var(--fr-ivory)" : "var(--fr-muted)" }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
