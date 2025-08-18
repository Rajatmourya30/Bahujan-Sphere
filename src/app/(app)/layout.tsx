import { Header } from '@/components/layout/Header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-grow p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
