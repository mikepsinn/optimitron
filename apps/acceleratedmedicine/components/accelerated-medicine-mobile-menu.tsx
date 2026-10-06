"use client"

import { Menu, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

/** The Accelerated Medicine header's links on screens narrower than the desktop navigation. */
export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <Button type="button" variant="outline" size="icon" aria-expanded={open} aria-controls="site-mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
        {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
      </Button>
      {open && (
        <nav id="site-mobile-menu" aria-label="Main" className="absolute inset-x-0 top-16 border-b bg-background shadow-sm">
          <ul className="container mx-auto flex flex-col px-4 py-2 md:px-6">
            {links.map(link => (
              <li key={link.href}>
                <a href={link.href} className="block py-3 font-medium hover:text-primary" onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
