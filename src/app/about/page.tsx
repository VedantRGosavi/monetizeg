'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen font-sans bg-phalo-green overflow-hidden">
      {/* Background gradient and noise overlay */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0" style={{background: 'radial-gradient(ellipse at 60% 40%, #1c3c36 0%, #0e1e1a 100%)'}} />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mix-blend-overlay opacity-60" style={{backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)'}} />

      {/* Navigation */}
      <nav className="absolute top-6 left-6 z-50">
        <Link 
          href="/"
          className="inline-flex items-center text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          title="Back to home"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </nav>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-mono font-medium text-white mb-16 lowercase tracking-wide">
            about monetizeg
          </h1>

          {/* Content sections */}
          <div className="space-y-12 text-lg sm:text-xl leading-relaxed text-white/80">
            <p>
              monetizeg is a platform designed for open source developers — built for 
              sustainability, growth, and fairness.
            </p>

            <p>
              we&apos;re not affiliated with github, google, or any other platform 
              mentioned anywhere on this site.
            </p>

            <p>
              this platform doesn&apos;t store your code or compromise your repositories — 
              everything happens through secure integrations for your financial benefit.
            </p>

            <p className="text-white">
              how you monetize is entirely up to you.
            </p>

            <p>
              you&apos;re responsible for what you do with the revenue — whether that&apos;s 
              funding development, supporting contributors, or growing your project.
            </p>

            <p>
              please be respectful of your users, maintain code quality, 
              and avoid compromising your project&apos;s integrity for short-term gains.
            </p>

            <p className="text-white">
              monetizeg is here to empower creators — not to exploit them.
            </p>
          </div>

          {/* Separator */}
          <div className="w-full max-w-2xl mx-auto border-t border-white/20 my-16"></div>

          {/* Personal note */}
          <div className="space-y-6 text-base sm:text-lg text-white/70">
            <p>
              if you&apos;re wondering why this even exists, or what&apos;s next —
            </p>
            
            <p>
              i built this because open source deserves sustainable funding.
            </p>

            <p className="text-white">
              thanks for checking it out.
            </p>

            <p>
              means a lot 🤝
            </p>

            <div className="pt-8">
              <p>
                stay in touch{' '}
                <a 
                  href="mailto:vedantgosavi20@gmail.com"
                  className="text-white hover:text-white/80 transition-colors underline"
                >
                  vedantgosavi20@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .bg-phalo-green { background: #123c2b; }
      `}</style>
    </div>
  );
} 