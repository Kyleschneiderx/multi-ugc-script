import { SideNav } from '@/components/SideNav';

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
