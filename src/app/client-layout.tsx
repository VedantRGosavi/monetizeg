'use client';

import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="fixed top-0 right-0 p-4 z-50">
        <SignedIn>
          <div className="flex items-center gap-2">
            <SignOutButton>
              <button className="px-3 py-1.5 text-sm rounded-md bg-white/10 hover:bg-white/20 text-white transition">
                Sign out
              </button>
            </SignOutButton>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
      </header>
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}
