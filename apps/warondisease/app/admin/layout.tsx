import { requireAdmin } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Layout from "@/components/layout"
import Link from "next/link"
import { ROUTES } from '@/lib/routes'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require admin access
  try {
    await requireAdmin()
  } catch {
    // Redirect non-admins to home page
    redirect("/")
  }

  return (
    <Layout>
      {/* Admin Navigation Bar */}
      <div className="bg-foreground text-background border-b-4 border-primary">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-6 py-3">
            <span className="font-black uppercase text-sm">ADMIN</span>
            <nav className="flex gap-4">
              <Link
                href={ROUTES.adminOrganizations}
                className="font-bold uppercase text-sm hover:text-brutal-cyan transition-colors"
              >
                Organizations
              </Link>
              <Link
                href={ROUTES.adminUsers}
                className="font-bold uppercase text-sm hover:text-brutal-cyan transition-colors"
              >
                Users
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      {children}
    </Layout>
  )
}
