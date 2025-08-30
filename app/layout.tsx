import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="container-app py-4">
        <header className="pb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">DealerTokes</h1>
              <p className="text-sm text-zinc-400">Track your tokes and hours.</p>
            </div>

            {/* Only show Sign out if logged in; no Sign in / Create here */}
            <div className="flex gap-2">
              {session ? <><SignOutButton /> <BackButton /> </>: null}
            </div>
          </header>
          <main className="space-y-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
