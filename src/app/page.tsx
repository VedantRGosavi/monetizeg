'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-sans bg-phalo-green overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />

      

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-1 z-10 w-full px-4">
        <h1 className="text-6xl sm:text-7xl font-mono font-semibold text-white mb-2 tracking-wide">monetizeG</h1>
        <p className="text-lg sm:text-xl text-white/70 mb-10 lowercase">monetize open source effortlessly</p>
        <form className="w-full max-w-xl flex items-center bg-white/5 rounded-2xl border border-white/10 shadow-lg mb-4" onSubmit={e => {e.preventDefault();}}>
          <input
            type="url"
            placeholder="paste github repo url here..."
            className="flex-1 bg-transparent outline-none px-6 py-5 text-white text-lg placeholder:text-white/40 lowercase"
            value={url}
            onChange={e => setUrl(e.target.value)}
            autoFocus
          />
          <button type="submit" className="m-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M3 12h13M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </form>
        <p className="text-xs text-white/40 mb-24 lowercase">supports github.com repositories</p>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8 left-0 w-full flex justify-center gap-6 text-white/40 text-xs lowercase z-10">
        <a href="#" className="hover:underline">about monetizeg</a>
        <span>&bull;</span>
        <a href="#" className="hover:underline">personal letter</a>
      </footer>
      <style jsx global>{`
        .bg-phalo-green { background: #123c2b; }
        @media (min-width: 640px) {
          h1 { letter-spacing: 0.04em; }
        }
      `}</style>
    </div>
  );
}
