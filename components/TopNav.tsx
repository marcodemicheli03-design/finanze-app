"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownCircle,
  Repeat,
  ShoppingBag,
  TrendingUp,
  Target,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/entrate", label: "Entrate", icon: ArrowDownCircle },
  { href: "/spese-fisse", label: "Fisse", icon: Repeat },
  { href: "/spese-variabili", label: "Variabili", icon: ShoppingBag },
  { href: "/investimenti", label: "Investimenti", icon: TrendingUp },
  { href: "/obiettivi", label: "Obiettivi", icon: Target },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: barra in alto */}
      <nav
        className="hide-mobile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "12px 24px",
          margin: "16px 24px 0",
        }}
      >
        <div
          className="card"
          style={{
            display: "flex",
            gap: 4,
            padding: 6,
            flexWrap: "wrap",
          }}
        >
          {links.map((l) => {
            const Icon = l.icon;
            const attivo = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  textDecoration: "none",
                  background: attivo ? "var(--accent)" : "transparent",
                  color: attivo ? "white" : "var(--ink)",
                  transition: "background 0.15s",
                }}
              >
                <Icon size={16} />
                {l.label}
              </Link>
            );
          })}
        </div>
        <div style={{ marginLeft: "auto" }}>
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile: barra fissa in basso, stile iOS tab bar */}
      <nav
        className="hide-desktop card"
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 4px",
          zIndex: 50,
        }}
      >
        {links.map((l) => {
          const Icon = l.icon;
          const attivo = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                fontSize: 10,
                textDecoration: "none",
                color: attivo ? "var(--accent)" : "var(--ink-soft)",
                padding: "4px 8px",
              }}
            >
              <Icon size={20} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
