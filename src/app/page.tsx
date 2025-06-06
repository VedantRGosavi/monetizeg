'use client';

import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      // Extract repo info from GitHub URL and redirect to dashboard
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        router.push(`/dashboard/repositories?add=${owner}/${repo}`);
      } else {
        alert('Please enter a valid GitHub repository URL');
      }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-sans bg-[#123c2b] overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div 
        aria-hidden 
        className="pointer-events-none fixed inset-0 z-0" 
        style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} 
      />
      <div 
        aria-hidden 
        className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" 
        style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} 
      />

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        <h1 className="text-6xl sm:text-7xl font-mono font-semibold text-white mb-2 tracking-wide sm:tracking-[0.04em]">
          monetizeG
        </h1>
        <p className="text-lg sm:text-xl text-white/70 mb-10 lowercase">
          monetize open source effortlessly
        </p>
        
        <SignedIn>
          <Link 
            href="/dashboard"
            className="px-6 py-3 bg-white text-[#123c2b] rounded-lg font-medium hover:bg-opacity-90 transition"
          >
            Go to Dashboard
          </Link>
        </SignedIn>
        
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-white text-[#123c2b] rounded-lg font-medium hover:bg-opacity-90 transition">
              Get Started
            </button>
          </SignInButton>
        </SignedOut>

        <div className="mt-12 w-full max-w-2xl">
          <form 
            className="w-full flex items-center bg-white/5 rounded-2xl border border-white/10 shadow-lg mb-4" 
            onSubmit={handleSubmit}
          >
            <input
              type="url"
              placeholder="paste github repo url here..."
              className="flex-1 bg-transparent outline-none px-6 py-5 text-white text-lg placeholder:text-white/40 lowercase"
              value={url}
              onChange={e => setUrl(e.target.value)}
              autoFocus
              required
            />
            <button 
              type="submit" 
              className="m-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
              aria-label="Submit repository"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                <path d="M3 12h13M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
          <p className="text-xs text-white/40 text-center lowercase">
            supports github.com repositories
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 left-0 w-full flex justify-center gap-6 text-white/40 text-xs lowercase z-10">
        <Link href="/about" className="hover:underline">about monetizeg</Link>
        <span>&bull;</span>
        <a 
          href="mailto:vedantgosavi20@gmail.com?subject=monetizeG Inquiry" 
          className="hover:underline"
        >
          contact us
        </a>
        <span>&bull;</span>
        <Link href="/pricing" className="hover:underline">pricing</Link>
      </footer>
    </div>
  );
}
