// app/auth/signup/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });
    if (res.ok) {
      await signIn("credentials", { email, password, callbackUrl: "/" });
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error ?? "Signup failed");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto card">
      <h2 className="text-lg font-semibold mb-3">Create account</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-xs text-zinc-400">Name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Password (min 6)</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button className="btn w-full" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
      </form>
      <div className="text-xs text-zinc-400 mt-3">
        Already have an account? <Link className="underline" href="/auth/signin">Sign in</Link>
      </div>
    </div>
  );
}
