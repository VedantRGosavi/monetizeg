import { UserButton } from "@stackframe/stack"
import Link from "next/link"

interface HeaderProps {
  showAuth?: boolean
}

export function Header({ showAuth = true }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            MonetizeG
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/about">About</Link>
          </nav>
        </div>
        
        {showAuth && (
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        )}
      </div>
    </header>
  )
} 