import { SideNav } from '@/components/SideNav';

// Force dynamic rendering to ensure middleware auth checks always run
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
