"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cva } from "class-variance-authority"
import { CircleIcon } from "lucide-react"

const navLinkVariants = cva([
  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
  "hover:bg-accent hover:text-accent-foreground",
])

export function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="flex items-center space-x-2">
      <Link
        href="/"
        className={navLinkVariants({
          className: pathname === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        })}
      >
        Contract Interface
      </Link>
      <Link
        href="/game"
        className={navLinkVariants({
          className: pathname === "/game" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        })}
      >
        <span className="inline mr-1">🥔</span>
        Play Game
      </Link>
    </nav>
  )
}