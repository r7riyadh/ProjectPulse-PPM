'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QuickDemoLogin } from '@/components/quick-demo-login'
import { 
  Briefcase, 
  Info, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  Loader2 
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        toast.error(`Authentication failed: ${error.message}`)
        setLoading(false)
      } else {
        sessionStorage.setItem('tab_session', 'true')
        toast.success('Logged in successfully! Redirecting...')
        window.location.assign('/dashboard')
      }
    } catch (err: any) {
      toast.error(`Unexpected login error: ${err.message || err}`)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <Toaster position="top-right" theme="light" richColors />
      
      <div className="max-w-md w-full space-y-6 animate-fade-in-up">
        
        {/* Logo and Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-text-primary text-surface flex items-center justify-center mx-auto shadow-md">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            ProjectPulse PPM
          </h1>
          <p className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">
            Enterprise IT Project Governance Platform
          </p>
        </div>

        {/* Info / Description Card */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-text-primary tracking-tight">Public Interactive Demo</h4>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Explore the role-based executive dashboard, timelines, risk heatmap matrices, RACI tables, and change requests using the quick login panel below.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/r7riyadh/ProjectPulse-PPM"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-background hover:bg-surface-raised border border-border text-text-primary font-medium py-2 px-3 rounded-lg text-xs transition-all shadow-sm cursor-pointer"
          >
            <GithubIcon className="w-4 h-4 text-text-primary" />
            <span>View Source Code on GitHub</span>
          </a>
        </div>

        {/* Quick Demo Login Card */}
        <QuickDemoLogin />

        {/* Standard Credentials Card */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-wider text-text-secondary font-medium">
            Standard Account Login
          </h3>
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email input field */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="employee@flowdesk.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Password input field */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-text-secondary uppercase tracking-widest block">
                Password
              </label>
              <div className="relative">
                <KeyRound className="h-4 w-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-text-primary hover:bg-black text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>Sign In</span>
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </main>
  )
}
