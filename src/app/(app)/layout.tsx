import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex h-screen max-w-md flex-col overflow-hidden border-x bg-background shadow-lg">
      <main className="flex-grow overflow-y-auto p-3 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
