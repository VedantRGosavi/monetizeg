'use client';

import { SignInButton, SignOutButton, SignedIn, SignedOut, UserButton, useAuth as useClerkAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

type UseAuth = () => {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  getToken: (options: { template?: string; skipCache?: boolean }) => Promise<string | null>;
  orgId: string | null | undefined;
  orgRole: string | null | undefined;
};

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useClerkAuth();
  
  const useAuth: UseAuth = () => ({
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    getToken: auth.getToken,
    orgId: auth.orgId,
    orgRole: auth.orgRole,
  });
  
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
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
    </ConvexProviderWithClerk>
  );
}
