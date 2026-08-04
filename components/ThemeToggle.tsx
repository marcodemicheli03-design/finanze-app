"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("finanze-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Cambia tema"
      style={{
        marginLeft: "auto",
        border: "1px solid var(--line)",
        background: "var(--card)",
        color: "var(--ink)",
        borderRadius: 6,
        width: 32,
        height: 32,
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
