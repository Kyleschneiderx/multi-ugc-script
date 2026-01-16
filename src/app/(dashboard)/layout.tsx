import { SideNav } from '@/components/SideNav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Force dynamic rendering to ensure auth checks always run
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
