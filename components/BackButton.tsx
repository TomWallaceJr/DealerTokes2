"use client";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      className="btn"
      aria-label="Go back"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/"); // fallback if there’s no history
        }
      }}
    >
      ← Back
    </button>
  );
}
