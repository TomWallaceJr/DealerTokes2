// components/SignOutButton.tsx
"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button className="btn" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </button>
  );
}
