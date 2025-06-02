import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignOutButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "monetizeG",
  description: "Monetize open source effortlessly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <body className="antialiased">
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
} 