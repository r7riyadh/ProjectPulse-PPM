'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function TabSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkTabSession = async () => {
      const isActiveTab = sessionStorage.getItem('tab_session');

      if (!isActiveTab) {
        // No tab session flag — tab was closed and reopened
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // A stored session exists but this tab is fresh — force re-login
          await supabase.auth.signOut({ scope: 'local' });
          router.replace('/login');
          return;
        }
      }

      // Mark this tab as active
      sessionStorage.setItem('tab_session', 'true');
    };

    checkTabSession();
  }, [router]);

  return <>{children}</>;
}
