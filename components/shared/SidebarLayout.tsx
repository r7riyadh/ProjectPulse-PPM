'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Briefcase, Shield, LogOut, Menu, X, User } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toast } from 'sonner'

interface SidebarLayoutProps {
  children: React.ReactNode
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    department: string
  }
}

export function SidebarLayout({ children, profile }: SidebarLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Logout failed')
    } else {
      toast.success('Signed out')
      router.refresh()
      router.push('/login')
    }
  }

  const menuItems = [
    { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Project Registry', path: '/projects', icon: Briefcase },
  ]

  if (profile.role === 'pmo_admin') {
    menuItems.push({ name: 'Admin Console', path: '/admin', icon: Shield })
  }

  return (
    <div className="h-screen w-screen bg-background text-text-primary flex overflow-hidden">
      
      {/* 1. Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border shrink-0 h-full overflow-y-auto">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border/60">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center font-mono font-bold text-white shadow-md shadow-primary/30">
              P
            </div>
            <span className="font-extrabold tracking-tight text-lg">
              Project<span className="text-primary">Pulse</span>
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.path)
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Info Bottom Panel */}
        <div className="p-4 border-t border-border/60 bg-surface-raised flex flex-col space-y-3">
          <div className="flex items-start space-x-3">
            <div className="h-9 w-9 rounded-full bg-border/50 flex items-center justify-center text-text-secondary border border-border/80 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-text-primary truncate">{profile.full_name}</p>
              <p className="text-[10px] text-text-muted truncate mt-0.5">{profile.department}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <StatusBadge status={profile.role} type="role" />
            <button
              onClick={handleLogout}
              className="text-text-muted hover:text-off-track p-1.5 rounded hover:bg-surface transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Responsive Mobile Sidebar drawer and dark overlay */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Dark overlay backdrop */}
        <div 
          onClick={() => setMobileOpen(false)}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        {/* Sidebar Drawer container */}
        <aside 
          className={`absolute top-0 bottom-0 left-0 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-14 flex items-center justify-between px-6 border-b border-border/60">
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center font-mono font-bold text-white shadow-md shadow-primary/30">
                P
              </div>
              <span className="font-extrabold tracking-tight text-lg">Project<span className="text-primary">Pulse</span></span>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="p-1 rounded hover:bg-surface-raised text-text-secondary cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.path)
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 min-h-[44px] ${
                    active
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/60 bg-surface-raised flex flex-col space-y-3">
            <div className="flex items-start space-x-3">
              <div className="h-9 w-9 rounded-full bg-border flex items-center justify-center text-text-secondary">
                <User className="h-4 w-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-text-primary truncate">{profile.full_name}</p>
                <p className="text-[10px] text-text-muted truncate">{profile.department}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <StatusBadge status={profile.role} type="role" />
              <button
                onClick={handleLogout}
                className="text-text-muted hover:text-off-track p-1 rounded hover:bg-surface transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile header / desktop minimal topbar */}
        <header className="h-14 lg:h-16 border-b border-border bg-surface/50 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
          <div className="flex items-center lg:space-x-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-text-secondary hover:bg-surface-raised lg:hidden cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="hidden lg:flex items-center space-x-2 text-base font-extrabold tracking-tight uppercase text-text-secondary font-mono">
              <span>{pathname.split('/')[1] === 'projects' ? 'Project Registry' : pathname.split('/')[1] === 'admin' ? 'Admin Console' : 'Executive Portfolio Dashboard'}</span>
              {pathname.includes('/projects/') && pathname.split('/').length > 2 && (
                <>
                  <span className="text-text-muted">/</span>
                  <span className="text-primary font-bold text-glow-primary">Project View</span>
                </>
              )}
            </h1>
          </div>

          {/* Centered logo on mobile */}
          <div className="flex-1 lg:hidden text-center truncate px-2">
            <span className="font-extrabold tracking-tight text-sm">
              Project<span className="text-primary">Pulse</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 font-mono text-xs text-text-muted">
            <span>Environment Status: </span>
            <span className="h-1.5 w-1.5 rounded-full bg-on-track animate-pulse" />
            <span className="text-on-track font-semibold">Active (Demo)</span>
          </div>

          {/* User profile avatar on mobile */}
          <div className="lg:hidden flex items-center">
            <div className="h-8 w-8 rounded-full bg-border/50 flex items-center justify-center text-text-secondary border border-border/80">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fade-in-up">
          {children}
        </div>
      </div>

    </div>
  )
}
