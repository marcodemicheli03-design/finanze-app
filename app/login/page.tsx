"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div className="card" style={{ padding: 40, width: 360, maxWidth: "100%" }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Finanze</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, marginTop: 0, marginBottom: 24 }}>
          Accesso riservato via email
        </p>

        {sent ? (
          <p style={{ fontSize: 14 }}>
            Ti ho mandato un link di accesso a <strong>{email}</strong>. Apri
            l&apos;email e clicca il link per entrare.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="tua@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid var(--line)",
                borderRadius: 12,
                fontSize: 14,
                marginBottom: 12,
                fontFamily: "var(--font-ui)",
              }}
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "var(--accent)",
                color: "var(--on-accent)",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Invia link di accesso
            </button>
            {error && (
              <p style={{ color: "var(--negative)", fontSize: 13, marginTop: 12 }}>
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
