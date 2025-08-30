// app/auth/signin/page.tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const q = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const callbackUrl = q.get("callbackUrl") || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl, redirect: true });
  }

  return (
    <div className="max-w-sm mx-auto card">
      <h2 className="text-lg font-semibold mb-3">Sign in</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-xs text-zinc-400">Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs text-zinc-400">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button className="btn w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
      </form>
      <div className="text-xs text-zinc-400 mt-3">
        No account? <Link className="underline" href="/auth/signup">Create one</Link>
      </div>
    </div>
  );
}
