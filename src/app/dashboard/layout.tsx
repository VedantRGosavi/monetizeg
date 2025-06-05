'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Repositories', href: '/dashboard/repositories' },
  { name: 'Analytics', href: '/dashboard/analytics' },
  { name: 'Payouts', href: '/dashboard/payouts' },
  { name: 'Settings', href: '/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-8">
              {/* Logo with home link */}
              <div className="flex items-center space-x-4">
                <Link 
                  href="/" 
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center"
                  title="Back to home"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/dashboard" className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors duration-200">
                  monetizeG
                </Link>
              </div>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${isActive 
                          ? 'bg-gray-100 text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* User section */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonPopoverCard: "bg-white border border-gray-200 shadow-lg",
                    }
                  }}
                />
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    block px-3 py-2 rounded-md text-base font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content with reduced padding */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {children}
      </main>
    </div>
  );
}
