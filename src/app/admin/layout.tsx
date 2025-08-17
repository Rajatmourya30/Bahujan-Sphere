// This is a simple layout for the admin section.
// In a real app, this might include admin-specific navigation.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="p-4">{children}</div>;
}
