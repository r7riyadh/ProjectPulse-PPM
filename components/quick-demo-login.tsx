'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserCheck, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  {
    role: 'pmo_admin',
    label: 'PMO Admin',
    email: 'admin@projectpulse.demo',
    password: 'ProjectPulse!2026',
    desc: 'Full portfolio oversight, user governance, and demo resets.'
  },
  {
    role: 'project_manager',
    label: 'Project Manager',
    email: 'pm@projectpulse.demo',
    password: 'ProjectPulse!2026',
    desc: 'Manage own projects, risks, budgets, and change requests.'
  },
  {
    role: 'team_member',
    label: 'Team Member',
    email: 'member@projectpulse.demo',
    password: 'ProjectPulse!2026',
    desc: 'Update milestone statuses and submit change requests.'
  },
  {
    role: 'stakeholder',
    label: 'Stakeholder',
    email: 'stakeholder@projectpulse.demo',
    password: 'ProjectPulse!2026',
    desc: 'Read-only access to assigned projects and RACI briefs.'
  }
];

export function QuickDemoLogin() {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleDemoClick = async (e: React.MouseEvent<HTMLButtonElement>, email: string, role: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingRole !== null) return;
    setLoadingRole(role);
    toast.loading('Signing in...', { id: 'demo-login' });

    try {
      const supabase = createClient();

      const account = DEMO_ACCOUNTS.find((a) => a.role === role);
      const password = account?.password || 'ProjectPulse!2026';

      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr || !data?.user) {
        toast.dismiss('demo-login');
        toast.error(authErr?.message || 'Authentication failed');
        setLoadingRole(null);
        return;
      }

      sessionStorage.setItem('tab_session', 'true');
      toast.success('Redirecting...', { id: 'demo-login' });
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.dismiss('demo-login');
      toast.error(err?.message || 'Login failed');
      setLoadingRole(null);
    }
  };

  return (
    <div className="glass-panel p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-xs uppercase tracking-wider text-text-secondary font-medium">
          Quick Demo Login
        </h3>
      </div>
      <p className="text-xs text-text-secondary">
        Click any role below to instantly log in as a pre-seeded test account:
      </p>

      <div className="grid grid-cols-1 gap-2.5">
        {DEMO_ACCOUNTS.map((account) => {
          const isLoading = loadingRole === account.role;
          return (
            <button
              key={account.role}
              type="button"
              onClick={(e) => handleDemoClick(e, account.email, account.role)}
              disabled={loadingRole !== null}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-background [@media(hover:hover)]:hover:bg-surface-raised [@media(hover:hover)]:hover:border-primary active:bg-surface-raised active:border-primary touch-manipulation transition-all text-left group disabled:opacity-50 cursor-pointer w-full"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-text-primary [@media(hover:hover)]:group-hover:text-primary group-active:text-primary transition-colors shrink-0">
                    {account.label}
                  </span>
                  <span className="font-mono text-[11px] text-text-secondary truncate">({account.email})</span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">{account.desc}</p>
              </div>

              {isLoading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-text-muted [@media(hover:hover)]:group-hover:text-primary [@media(hover:hover)]:group-hover:translate-x-0.5 group-active:text-primary group-active:translate-x-0.5 transition-all" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
