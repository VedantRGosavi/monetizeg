'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
  },
  {
    title: "Repositories",
    href: "/dashboard/repositories",
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
  },
  {
    title: "Intelligent Ads",
    href: "/dashboard/intelligent-ads",
  },
  {
    title: "Payouts",
    href: "/dashboard/payouts",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="font-semibold">
          MonetizeG
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                isActive ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
              )}
            >
              {item.icon && (
                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              )}
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
} 