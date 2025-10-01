'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/auth-context'
import { Menu, X, Home, Briefcase, FileText, Bell, User, LogOut } from 'lucide-react'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
    router.push('/')
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      title: 'Jobs',
      href: '/jobs',
      icon: Briefcase
    },
    {
      title: 'Applications',
      href: '/applications',
      icon: FileText
    },
    {
      title: 'Notifications',
      href: '/notifications',
      icon: Bell
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: User
    }
  ]

  if (!user) return null

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0" role="dialog" aria-labelledby="mobile-nav-title">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                onClick={() => setOpen(false)}
                aria-label="Acadia Job Bank - Go to dashboard"
              >
                <span id="mobile-nav-title" className="font-bold text-lg">Job Bank</span>
              </Link>
            </div>

            <div className="flex-1 py-4">
              <nav className="space-y-2" role="navigation" aria-label="Mobile navigation" id="mobile-navigation">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="border-t pt-4 space-y-4">
              {profile && (
                <div className="px-3" role="region" aria-label="User information">
                  <div className="text-sm font-medium">{profile.full_name}</div>
                  <div className="text-xs text-muted-foreground">{profile.email}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {profile.role} • {profile.department}
                  </div>
                </div>
              )}
              
              <Button
                variant="ghost"
                className="w-full justify-start px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={handleSignOut}
                aria-label="Sign out of your account"
              >
                <LogOut className="h-4 w-4 mr-3" aria-hidden="true" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}