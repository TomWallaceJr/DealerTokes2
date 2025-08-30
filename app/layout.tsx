import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DealerTokes",
  description: "Track your tokes, hours, and hourly rate—fast.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-4xl p-4">
          <header className="pb-6">
            <h1 className="text-2xl font-semibold">DealerTokes</h1>
            <p className="text-sm text-zinc-400">Simple, fast income tracking for poker dealers.</p>
          </header>
          <main className="space-y-6">{children}</main>
          <footer className="pt-8 text-xs text-zinc-500">© {new Date().getFullYear()} DealerTokes</footer>
        </div>
      </body>
    </html>
  );
}
