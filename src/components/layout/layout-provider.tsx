import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { cn } from "../../lib/utils"

interface LayoutProviderProps {
  children: React.ReactNode
  showSidebar?: boolean
  showHeader?: boolean
}

export function LayoutProvider({
  children,
  showSidebar = false,
  showHeader = true,
}: LayoutProviderProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={cn(
          "flex-1",
          showSidebar && "md:pl-64"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
} 